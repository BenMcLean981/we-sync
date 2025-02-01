import { type RemoteFetcher } from './remote-fetcher.js';
import { type Commit } from '../commit/index.js';
import {
  type Branch,
  makeLocalBranch,
  type Workspace,
  WorkspaceImp,
} from '../workspace/index.js';
import { type Memento } from '../memento/index.js';
import { getAllPreviousCommitsHashes } from '../workspace/navigation.js';

export class WorkspaceBasedRemoteFetcher<TState extends Memento>
  implements RemoteFetcher<TState>
{
  public constructor(workspace: Workspace<TState> = WorkspaceImp.makeEmpty()) {
    this._workspace = workspace;
  }

  private _workspace: Workspace<TState>;

  public get workspace(): Workspace<TState> {
    return this._workspace;
  }

  public async fetch(
    branchName: string,
    from: string
  ): Promise<ReadonlyArray<Commit<TState>>> {
    if (!this._workspace.hasCommit(from)) {
      return [];
    }

    const local = this._workspace.branches.getLocalBranch(branchName);
    const hashes = getAllPreviousCommitsHashes<TState>(
      this._workspace,
      local.head,
      (c) => c.hash === from
    );

    return [...hashes].map((h) => this._workspace.getCommit(h));
  }

  public async push(
    commits: ReadonlyArray<Commit<TState>>,
    branchName: string,
    newHead: string
  ): Promise<void> {
    this.validatePush(commits, branchName, newHead);

    const newBranches = this._workspace.branches.upsertBranch(
      makeLocalBranch(branchName, newHead)
    );

    this._workspace = this._workspace
      .addCommits(commits)
      .setBranches(newBranches);
  }

  public async getBranch(branchName: string): Promise<Branch | undefined> {
    if (!this._workspace.branches.containsLocalBranch(branchName)) {
      return undefined;
    } else {
      return this._workspace.branches.getLocalBranch(branchName);
    }
  }

  private validatePush(
    commits: ReadonlyArray<Commit<TState>>,
    branchName: string,
    newHead: string
  ) {
    const withAddition = this._workspace.addCommits(commits);
    const toRoot = getAllPreviousCommitsHashes(withAddition, newHead);

    const missingBranch =
      this._workspace.branches.containsLocalBranch(branchName);

    if (!missingBranch) {
      return;
    }

    const oldHead = this._workspace.branches.getLocalBranch(branchName).head;

    const isDescendent = toRoot.has(oldHead);

    if (!isDescendent) {
      throw new Error('Cannot push, local is missing commits from upstream.');
    }
  }
}
