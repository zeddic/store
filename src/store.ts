import produce from 'immer';
import {BehaviorSubject, distinctUntilChanged, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {QueryInput, StoreQuery} from './store_query';

export interface StoreOptions<State> {
  initialState: State;
}

export class Store<State> {
  private subject: BehaviorSubject<State>;

  constructor(options: StoreOptions<State>) {
    this.subject = new BehaviorSubject<State>(options.initialState);
  }

  set(state: State) {
    this.subject.next(state);
  }

  update(produceFn: ProduceFn<State>) {
    // Immer throws an error if the produce function returns anything.
    // To prevent this, the produceFn is wrapped to ensure returned
    // values are ignored.
    const wrappedProduceFn = (state: State) => {
      produceFn(state);
    };

    const oldState = this.get();
    const newState = produce(oldState, wrappedProduceFn);
    this.set(newState);
  }

  get(): State;
  get<Value>(selector: Selector<State, Value>): Value;
  get<Value>(selector?: Selector<State, Value>): State | Value {
    return selector ? selector(this.subject.value) : this.subject.value;
  }

  select(): Observable<State>;
  select<Value>(selector: Selector<State, Value>): Observable<Value>;
  select<Value>(selector?: Selector<State, Value>): Observable<State | Value> {
    const mapFn = selector || ((a: State) => a);
    return this.subject.asObservable().pipe(
      map(state => mapFn(state)),
      distinctUntilChanged()
    );
  }

  query(): StoreQuery<State>;
  query<Value>(selector: Selector<State, Value>): StoreQuery<Value>;
  query<Value>(selector?: Selector<State, Value>): StoreQuery<State | Value> {
    const mapFn = selector || ((a: State) => a);
    const input = asQueryInput(this);
    const query = new StoreQuery<State | Value>([input], mapFn);
    return query;
  }
}

export interface Selector<A, B> {
  (a: A): B;
}

export interface ProduceFn<State> {
  (a: State): void;
}

function asQueryInput<Value>(store: Store<Value>): QueryInput<Value> {
  return {
    get: () => store.get(),
    select: () => store.select(),
    sources: () => [store],
  };
}
