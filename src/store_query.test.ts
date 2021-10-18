import {Store} from './store';

describe('basic store', () => {
  let store: Store<PersonState>;
  let cityStore: Store<CityState>;

  let initial: PersonState = {person: {first: 'Joe', last: 'Smith'}, city: 1};
  let initialCities: CityState = {
    1: {name: 'Denver', country: 'USA'},
    2: {name: 'Boston', country: 'USA'},
    3: {name: 'Tokyo', country: 'Japan'},
  };

  beforeEach(() => {
    store = new Store<PersonState>({initialState: initial});
    cityStore = new Store<CityState>({initialState: initialCities});
  });

  test('a query can get a sub-part of a store', () => {
    const query = store.query(s => s.person.first);
    expect(query.get()).toEqual('Joe');

    store.update(s => (s.person.first = 'Joey'));
    expect(query.get()).toEqual('Joey');
  });

  test('a query can subscribe to a sub-part of a store', () => {
    const query = store.query(s => s.person.first);
    const seen: string[] = [];
    query.select().subscribe(v => seen.push(v));

    store.update(s => (s.person.first = 'Joey'));
    store.update(s => (s.person.first = 'Jo'));

    expect(seen).toEqual(['Joe', 'Joey', 'Jo']);
  });

  test('a query does not re-emit if a value remained the same', () => {
    const query = store.query(s => s.person.first);
    const seen: string[] = [];
    query.select().subscribe(v => seen.push(v));

    store.update(s => (s.person.first = 'Joey'));
    store.update(s => (s.person.first = 'Joey'));

    expect(seen).toEqual(['Joe', 'Joey']);
  });

  test('a query can be mapped to another query', () => {
    const person = store.query(s => s.person);
    const first = person.map(p => p.first);

    const seen: string[] = [];
    first.select().subscribe(v => seen.push(v));

    expect(first.get()).toEqual('Joe');
    expect(seen).toEqual(['Joe']);
  });

  test('two queries from the same store can be joined', () => {
    const first = store.query(s => s.person.first);
    const city = store.query(s => s.city);
    const sentance = first.join(city, (name, city) => {
      return `${name} lives in city #${city}`;
    });

    expect(sentance.get()).toBe('Joe lives in city #1');

    const seen: string[] = [];
    sentance.select().subscribe(v => seen.push(v));

    store.update(s => (s.city = 3));
    store.update(s => (s.person.first = 'Joey'));

    expect(seen).toEqual(['Joe lives in city #1', 'Joe lives in city #3', 'Joey lives in city #3']);
  });

  test('joining queries between different stores', () => {
    const name = store.query(s => s.person.first);
    const cityId = store.query(s => s.city);
    const cities = cityStore.query();

    const sentance = cityId.join(cities, name, (cityId, cities, name) => {
      return `${name} lives in ${cities[cityId].name}`;
    });

    expect(sentance.get()).toBe(`Joe lives in Denver`);

    const seen: string[] = [];
    sentance.select().subscribe(v => seen.push(v));

    store.update(s => (s.city = 2));
    store.update(s => (s.city = 3));
    cityStore.update(s => (s[3] = {name: 'Osaka', country: 'Japan'}));

    expect(seen).toEqual([
      'Joe lives in Denver',
      'Joe lives in Boston',
      'Joe lives in Tokyo',
      'Joe lives in Osaka',
    ]);
  });
});

interface PersonState {
  person: {
    first: string;
    last: string;
  };
  city: number;
}
interface CityState {
  [key: number]: {name: string; country: string};
}
