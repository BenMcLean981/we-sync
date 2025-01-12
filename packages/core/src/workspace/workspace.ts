import { Equalable } from '../equality/index.js';
import { Snapshot } from '../memento/snapshot.js';
import { Commit, CommitSnapshot } from '../commit/commit.js';
import { Branches } from './branches.js';

export interface Workspace<TState> extends Equalable {
  readonly id: string;

  readonly head: Commit<TState>;

  readonly branches: Branches;

  getState(hash: string): TState;

  getCommit(hash: string): Commit<TState>;

  addCommit(commit: Commit<TState>): Workspace<TState>;

  addCommits(commits: Iterable<Commit<TState>>): Workspace<TState>;

  setBranches(branches: Branches): Workspace<TState>;
}

export interface ClonedWorkspaceSnapshot extends Snapshot {
  id: string;

  headHash: string;

  commits: ReadonlyArray<CommitSnapshot>;
}
