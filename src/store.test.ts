import {Store} from './store';

test('create a store with initial state', () => {
  const store = new Store<PersonState>({
    initialState: {
      person: {first: 'Joe', last: 'Smith'},
    },
  });

  const state = store.get();
  expect(state).toEqual({
    person: {first: 'Joe', last: 'Smith'},
  });
});

describe('reading data', () => {
  let store: Store<PersonState>;
  let initial: PersonState = {person: {first: 'Joe', last: 'Smith'}};

  beforeEach(() => {
    store = new Store<PersonState>({
      initialState: initial,
    });
  });

  test('it can get a specific part of the store', () => {
    expect(store.get(s => s.person)).toEqual({first: 'Joe', last: 'Smith'});
    expect(store.get(s => s.person.first)).toEqual('Joe');
  });

  test('it can observe the store', () => {
    const seen: PersonState[] = [];
    store.select().subscribe(state => seen.push(state));

    // verify it emitted the first state on subscribe
    expect(seen.length).toBe(1);
    expect(seen[0]).toEqual(initial);

    // modify the state and verify a new emit
    const next = {person: {first: 'Sue', last: 'Conner'}};
    store.set(next);
    expect(seen.length).toBe(2);
    expect(seen[1]).toEqual(next);
  });

  test('it can observe a specific part of the store', () => {
    const seen: string[] = [];
    store.select(s => s.person.first).subscribe(name => seen.push(name));

    const next = {person: {first: 'Sue', last: 'Conner'}};
    store.set(next);
    expect(seen).toEqual(['Joe', 'Sue']);
  });

  test('it does not emit twice if the selected value is the same', () => {
    const seen: string[] = [];
    store.select(s => s.person.first).subscribe(name => seen.push(name));

    store.set({person: {first: 'Sue', last: 'Conner'}});
    store.set({person: {first: 'Sue', last: 'Conner'}});
    store.set({person: {first: 'Joe', last: 'Smith'}});
    store.set({person: {first: 'Joe', last: 'Smith'}});

    // Verify that duplicate values were de-deuped and it only emitted when
    // there was a change.
    expect(seen).toEqual(['Joe', 'Sue', 'Joe']);
  });
});

interface PersonState {
  person: {
    first: string;
    last: string;
  };
}
