export class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  get count(): number {
    return this.items.length;
  }

  forEach(callback: (item: T, index: number) => void): void {
    this.items.forEach(callback);
  }
}

export interface HasId {
  id: Id;
}

import { Id } from "../types/Point";

export class Repository<T extends HasId> {
  private store: Map<Id, T> = new Map();

  save(entity: T): void {
    this.store.set(entity.id, entity);
  }

  findById(id: Id): T | undefined {
    return this.store.get(id);
  }

  findAll(): T[] {
    return Array.from(this.store.values());
  }
}

export function identity<T>(value: T): T {
  return value;
}

export function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}
