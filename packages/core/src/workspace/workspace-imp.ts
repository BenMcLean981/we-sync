import type { Workspace } from './workspace.js';
import type { Commit } from '../commit/commit.js';
import { InitialCommit } from '../commit/initial-commit.js';
import type { Memento } from '../memento/memento.js';
import { uuid } from '../id.js';
import { Branches, makeLocalBranch } from './branches.js';
import { BranchesImp } from './branches-imp.js';

export const MAIN_BRANCH = 'main';

export class WorkspaceImp<TState> implements Workspace<TState> {
  private readonly _commits: Record<string, Commit<TState>>;

  private readonly _branches: Branches;

  private readonly _id: string;

  private constructor(
    commits: Record<string, Commit<TState>>,
    branches: Branches,
    id: string = uuid()
  ) {
    this._commits = commits;
    this._branches = branches;
    this._id = id;
  }

  public get id(): string {
    return this._id;
  }

  public get branches(): Branches {
    return this._branches;
  }

  public get head(): Commit<TState> {
    return this.getCommit(this._branches.getLocalBranch(MAIN_BRANCH).head);
  }

  public static makeNew<TState extends Memento>(
    initial: TState
  ): Workspace<TState> {
    const initialCommit = new InitialCommit(initial);

    return new WorkspaceImp(
      WorkspaceImp.convertCommits([initialCommit]),
      BranchesImp.makeNew(makeLocalBranch(MAIN_BRANCH, initialCommit.hash))
    );
  }

  private static convertCommits<TState>(
    commits: Iterable<Commit<TState>>
  ): Record<string, Commit<TState>> {
    const result: Record<string, Commit<TState>> = {};

    for (const commit of commits) {
      result[commit.hash] = commit;
    }

    return result;
  }

  public getCommit(hash: string): Commit<TState> {
    const commit = this._commits[hash];

    if (commit === undefined) {
      throw new Error(`No commit with hash "${hash}" exists.`);
    }

    return commit;
  }

  public hasCommit(hash: string): boolean {
    return hash in this._commits;
  }

  public addCommit(commit: Commit<TState>): Workspace<TState> {
    if (commit.hash in this._commits) {
      throw new Error('Commit already in workspace.');
    }

    if (commit.parents.size === 0) {
      throw new Error('Cannot add dangling commit.');
    }

    if ([...commit.parents].some((parentHash) => !this.hasCommit(parentHash))) {
      throw new Error('Missing parent commit.');
    }

    return new WorkspaceImp(
      { ...this._commits, [commit.hash]: commit },
      this._branches,
      this._id
    );
  }

  public addCommits(commits: Iterable<Commit<TState>>): Workspace<TState> {
    return [...commits].reduce(
      (w, c) => w.addCommit(c),
      this as Workspace<TState>
    );
  }

  public setBranches(branches: Branches): Workspace<TState> {
    branches.getAll().forEach((branch) => {
      if (!this.hasCommit(branch.head)) {
        throw new Error(
          `Missing hash "${branch.head}" for branch "${branch.name}".`
        );
      }
    });

    return new WorkspaceImp(this._commits, branches, this._id);
  }

  /**
   * @deprecated use setBranches.
   *
   * @param hash
   */
  public setHead(hash: string): Workspace<TState> {
    if (!(hash in this._commits)) {
      throw new Error('Commit not in workspace.');
    }

    return new WorkspaceImp(
      this._commits,
      this._branches.updateBranch(makeLocalBranch(MAIN_BRANCH, hash)),
      this._id
    );
  }

  public getState(hash: string): TState {
    const commit = this.getCommit(hash);

    const parents: Record<string, TState> = {};

    for (const parentHash of commit.parents) {
      parents[parentHash] = this.getState(parentHash);
    }

    return commit.apply(parents);
  }

  public equals(other: unknown, tol?: number): boolean {
    throw new Error('Method not implemented.');
  }
}
