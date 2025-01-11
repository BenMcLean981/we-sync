import type { Snapshot } from '../memento/snapshot.ts';

export interface Commit<TState> {
  readonly hash: string;

  readonly parents: Set<string>;

  apply(parents: Record<string, TState>): TState;
}

export interface CommitSnapshot extends Snapshot {
  type: string;

  hash: string;

  parents: ReadonlyArray<string>;
}
