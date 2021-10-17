import {combineLatest, distinctUntilChanged, map, Observable} from 'rxjs';
import {Selector, Store} from './store';

export class StoreQuery<Value> {
  private readonly inputs: QueryInput<any>[];
  private readonly projector: AnyProjector<Value>;
  private readonly sourceStores: Store<any>[];

  constructor(inputs: QueryInput<any>[], projector: AnyProjector<Value>) {
    this.inputs = inputs;
    this.projector = projector;
    this.sourceStores = combineSources(inputs);
  }

  get(): Value {
    const inputValues = this.inputs.map(i => i.get());
    const value = this.projector.apply(null, inputValues);
    return value;
  }

  select() {
    const sourceValues = this.sourceStores.map(s => s.select());
    return combineLatest(sourceValues).pipe(
      map(() => this.get()),
      distinctUntilChanged()
    );
  }

  sources(): Store<any>[] {
    return this.sourceStores;
  }

  map<NewValue>(selector: Selector<Value, NewValue>): StoreQuery<NewValue> {
    return new StoreQuery([this], selector);
  }

  join<A, NewValue>(a: QueryInput<A>, projector: (a: A) => NewValue): StoreQuery<NewValue>;

  join<A, B, NewValue>(
    a: QueryInput<A>,
    b: QueryInput<B>,
    projector: (a: A, b: B) => NewValue
  ): StoreQuery<NewValue>;

  join<A, B, C, NewValue>(
    a: QueryInput<A>,
    b: QueryInput<B>,
    c: QueryInput<C>,
    projector: (a: A, b: B, c: C) => NewValue
  ): StoreQuery<NewValue>;

  join<A, B, C, D, NewValue>(
    a: QueryInput<A>,
    b: QueryInput<B>,
    c: QueryInput<C>,
    d: QueryInput<D>,
    projector: (a: A, b: B, c: C, d: D) => NewValue
  ): StoreQuery<NewValue>;

  join<A, B, C, D, E, NewValue>(
    a: QueryInput<A>,
    b: QueryInput<B>,
    c: QueryInput<C>,
    d: QueryInput<D>,
    e: QueryInput<E>,
    projector: (a: A, b: B, c: C, d: D, e: E) => NewValue
  ): StoreQuery<NewValue>;

  join(...args: (QueryInput<{}> | AnyProjector<{}>)[]): StoreQuery<{}> {
    const projector = args.pop() as AnyProjector<{}>;
    const inputs = args as QueryInput<{}>[];
    return new StoreQuery<{}>(inputs, projector);
  }
}

export interface QueryInput<InputValue> {
  get(): InputValue;
  select(): Observable<InputValue>;
  sources(): Store<any>[];
}

type AnyProjector<Value> = (...args: any[]) => Value;

function combineSources(inputs: QueryInput<any>[]) {
  const sources: Store<any>[] = [];
  for (const input of inputs) {
    sources.push(...input.sources());
  }
  return sources;
}

// export interface Selector<A, B> {
//   (a: A): B;
// }
// export interface Joinable<T> {
//   snapshot(): T;
//   select(): Observable<T>;
// }

// export function create<A, R>(a: QueryInput<A>, projector: (a: A) => R): StoreQuery<R>;

// export function create<A, B, R>(
//   a: QueryInput<A>,
//   b: QueryInput<B>,
//   projector: (a: A, b: B) => R
// ): StoreQuery<R>;

// export function create<A, B, C, R>(
//   a: QueryInput<A>,
//   b: QueryInput<B>,
//   c: QueryInput<C>,
//   projector: (a: A, b: B, c: C) => R
// ): StoreQuery<R>;

// export function create<A, B, C, D, R>(
//   a: QueryInput<A>,
//   b: QueryInput<B>,
//   c: QueryInput<C>,
//   d: QueryInput<D>,
//   projector: (a: A, b: B, c: C, d: D) => R
// ): StoreQuery<R>;

// export function create(...args: (QueryInput<{}> | AnyProjector<{}>)[]): StoreQuery<{}> {
//   const projector = args.pop() as AnyProjector<{}>;
//   const inputs = args as QueryInput<{}>[];
//   return new StoreQuery<{}>(inputs, projector);
// }
