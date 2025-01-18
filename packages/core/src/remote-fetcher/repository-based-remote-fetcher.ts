import { type RemoteFetcher } from './remote-fetcher.js';
import { type Commit } from '../commit/index.js';
import {
  makeLocalBranch,
  type Workspace,
  WorkspaceImp,
} from '../workspace/index.js';
import { getAllPreviousCommits } from 'src/sync/differences.js';
import { type Memento } from '../memento/index.js';

export class WorkspaceBasedRemoteFetcher<TState extends Memento>
  implements RemoteFetcher<TState>
{
  private _workspace: Workspace<TState>;

  public constructor(workspace: Workspace<TState> = WorkspaceImp.makeEmpty()) {
    this._workspace = workspace;
  }

  public async fetch(
    branchName: string,
    hash: string
  ): Promise<ReadonlyArray<Commit<TState>>> {
    const local = this._workspace.branches.getLocalBranch(branchName);
    const hashes = getAllPreviousCommits<TState>(
      this._workspace,
      local.head,
      hash
    );

    return [...hashes].map((h) => this._workspace.getCommit(h));
  }

  public async push(
    commits: ReadonlyArray<Commit<TState>>,
    branchName: string,
    head: string
  ): Promise<void> {
    // TODO: Check for conflict...

    this._workspace = this._workspace.addCommits(commits);

    this.createBranchIfNotExists(branchName, head);
  }

  private createBranchIfNotExists(branchName: string, head: string): void {
    if (!this._workspace.branches.containsLocalBranch(branchName)) {
      const newBranches = this._workspace.branches.addBranch(
        makeLocalBranch(branchName, head)
      );

      this._workspace = this._workspace.setBranches(newBranches);
    }
  }
}
