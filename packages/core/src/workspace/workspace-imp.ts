import type { Workspace } from './workspace.js';
import type { Commit } from '../commit/commit.js';
import { InitialCommit } from '../commit/initial-commit.js';
import type { Memento } from '../memento/memento.js';
import { uuid } from '../id.js';

export class WorkspaceImp<TState> implements Workspace<TState> {
  private readonly _commits: Record<string, Commit<TState>>;

  private readonly _headHash: string;

  private readonly _id: string;

  private constructor(
    commits: Record<string, Commit<TState>>,
    headHash: string,
    id: string = uuid()
  ) {
    this._commits = commits;
    this._headHash = headHash;
    this._id = id;
  }

  public get id(): string {
    return this._id;
  }

  get head(): Commit<TState> {
    return this.getCommit(this._headHash);
  }

  public static makeNew<TState extends Memento>(
    initial: TState
  ): Workspace<TState> {
    const initialCommit = new InitialCommit(initial);

    return new WorkspaceImp(
      WorkspaceImp.convertCommits([initialCommit]),
      initialCommit.hash
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

  public addCommit(commit: Commit<TState>): Workspace<TState> {
    if (commit.hash in this._commits) {
      throw new Error('Commit already in workspace.');
    }

    if (commit.parent === null) {
      throw new Error('Commit has no parent.');
    }

    if (!(commit.parent in this._commits)) {
      throw new Error('Missing parent commit.');
    }

    return new WorkspaceImp(
      { ...this._commits, [commit.hash]: commit },
      this._headHash,
      this._id
    );
  }

  public setHead(hash: string): Workspace<TState> {
    if (!(hash in this._commits)) {
      throw new Error('Commit not in workspace.');
    }

    return new WorkspaceImp(this._commits, hash, this._id);
  }

  public getState(hash: string): TState {
    const chain = this.getRootChain(hash);
    const inOrder = chain.toReversed();

    return inOrder.reduce((state, commit) => commit.apply(state), {} as TState);
  }

  public equals(other: unknown, tol?: number): boolean {
    throw new Error('Method not implemented.');
  }

  // TODO: Move this to a navigator.
  private getRootChain(hash: string): ReadonlyArray<Commit<TState>> {
    const commit = this.getCommit(hash);

    return this.extendToRoot([commit]);
  }

  private extendToRoot(
    chain: ReadonlyArray<Commit<TState>>
  ): ReadonlyArray<Commit<TState>> {
    const deepest = chain[chain.length - 1];

    if (deepest.parent === null) {
      return chain;
    } else {
      const extended = [...chain, this.getCommit(deepest.parent)];

      return this.extendToRoot(extended);
    }
  }
}
