import type { ID, Identifiable } from '../id.js';
import type { Subject } from '../observer/index.js';

export interface Repository<T extends Identifiable> {
  readonly onAdd: Subject<T>;

  readonly onUpdate: Subject<T>;

  readonly onDelete: Subject<T>;

  contains(id: ID): Promise<boolean>;

  get(id: ID): Promise<T>;

  add(item: T): Promise<void>;

  update(item: T): Promise<void>;

  delete(id: ID): Promise<void>;
}
