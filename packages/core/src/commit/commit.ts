import type { Snapshot } from '../memento/snapshot.ts';

export interface Commit<TState> {
  readonly hash: string;

  readonly parent: string | null;

  apply(state: TState): TState;
}

export interface CommitSnapshot extends Snapshot {
  type: string;

  hash: string;

  parent: string | null;
}
