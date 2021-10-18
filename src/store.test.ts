import {Store} from './store';

describe('basic store', () => {
  let store: Store<PersonState>;
  let initial: PersonState = {person: {first: 'Joe', last: 'Smith'}, address: {city: 'Denver'}};

  beforeEach(() => {
    store = new Store<PersonState>({
      initialState: initial,
    });
  });

  test('create a store with initial state', () => {
    const store = new Store<PersonState>({
      initialState: {
        person: {first: 'Joe', last: 'Smith'},
        address: {city: 'Denver'},
      },
    });

    const state = store.get();
    expect(state).toEqual({
      person: {first: 'Joe', last: 'Smith'},
      address: {city: 'Denver'},
    });
  });

  describe('getting data', () => {
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
      const next = {person: {first: 'Sue', last: 'Conner'}, address: {city: 'Boston'}};
      store.set(next);
      expect(seen.length).toBe(2);
      expect(seen[1]).toEqual(next);
    });

    test('it can observe a specific part of the store', () => {
      const seen: string[] = [];
      store.select(s => s.person.first).subscribe(name => seen.push(name));

      const next = {person: {first: 'Sue', last: 'Conner'}, address: {city: 'Boston'}};
      store.set(next);
      expect(seen).toEqual(['Joe', 'Sue']);
    });

    test('it does not emit twice if the selected value is the same', () => {
      const seen: string[] = [];
      store.select(s => s.person.first).subscribe(name => seen.push(name));

      store.set({person: {first: 'Sue', last: 'Conner'}, address: {city: 'Boston'}});
      store.set({person: {first: 'Sue', last: 'Conner'}, address: {city: 'Boston'}});
      store.set({person: {first: 'Joe', last: 'Smith'}, address: {city: 'Denver'}});
      store.set({person: {first: 'Joe', last: 'Smith'}, address: {city: 'Denver'}});

      // Verify that duplicate values were de-deuped and it only emitted when
      // there was a change.
      expect(seen).toEqual(['Joe', 'Sue', 'Joe']);
    });
  });

  describe('updating', () => {
    test('update can mutate a sub-part of the store', () => {
      expect(store.get(s => s.person.first)).toBe('Joe');
      store.update(state => (state.person.first = 'Sue'));
      expect(store.get(s => s.person.first)).toBe('Sue');
    });

    test('updates to one part of store do not mutate other parts', () => {
      const oldPerson = store.get(s => s.person);
      const oldAddress = store.get(s => s.address);
      store.update(state => (state.address.city = 'Boston'));

      const newPerson = store.get(s => s.person);
      const newAddress = store.get(s => s.address);

      expect(newPerson).toBe(oldPerson);
      expect(newAddress).not.toBe(oldAddress);
    });

    test('updates to one part of the store do not trigger listeners to other parts', () => {
      let count = 0;
      store.select(s => s.person).subscribe(() => count++);
      expect(count).toBe(1);

      // Change unrelated part. Verify no change.
      store.update(state => (state.address.city = 'Boston'));
      expect(count).toBe(1);

      // Change related part. Verify change emitted.
      store.update(state => (state.person.last = 'Conner'));
      expect(count).toBe(2);
    });
  });

  describe('queries', () => {
    test('creating a simple query to a part of the store', () => {
      const person = store.query(s => s.person);
      expect(person.get()).toEqual({first: 'Joe', last: 'Smith'});

      let count = 0;
      person.select().subscribe(() => count++);
      expect(count).toBe(1);

      store.update(s => (s.person.first = 'Joey'));
      expect(count).toBe(2);
    });

    test('creating a query to the entire store', () => {
      const query = store.query();
      expect(query.get()).toEqual(initial);
    });
  });
});

interface PersonState {
  person: {
    first: string;
    last: string;
  };
  address: {
    city: string;
  };
}
