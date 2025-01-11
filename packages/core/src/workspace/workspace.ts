import { Equalable } from '../equality/index.js';
import { Snapshot } from '../memento/snapshot.js';
import { Commit, CommitSnapshot } from '../commit/commit.js';

export interface Workspace<TState> extends Equalable {
  readonly id: string;

  readonly head: Commit<TState>;

  getState(hash: string): TState;

  addCommit(commit: Commit<TState>): Workspace<TState>;

  setHead(hash: string): Workspace<TState>;
}

export interface ClonedWorkspaceSnapshot extends Snapshot {
  id: string;

  headHash: string;

  commits: ReadonlyArray<CommitSnapshot>;
}
