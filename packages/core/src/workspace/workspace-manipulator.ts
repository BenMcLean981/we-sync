import { type Workspace } from './workspace.js';
import { CommandCommit, type Commit } from '../commit/index.js';
import { MAIN_BRANCH } from './workspace-imp.js';
import { makeLocalBranch } from '../branches/index.js';
import { type Command } from '../command/index.js';
import { type Memento } from '../memento/index.js';

export class WorkspaceManipulator<TState extends Memento> {
  private readonly _workspace: Workspace<TState>;

  public constructor(workspace: Workspace<TState>) {
    this._workspace = workspace;
  }

  public get workspace(): Workspace<TState> {
    return this._workspace;
  }

  public apply(
    command: Command<TState>,
    branchName = MAIN_BRANCH
  ): WorkspaceManipulator<TState> {
    const head = this._workspace.branches.getLocalBranch(branchName).head;

    return this.commit(new CommandCommit(head, command), branchName);
  }

  public commit(
    commit: Commit<TState>,
    branchName = MAIN_BRANCH
  ): WorkspaceManipulator<TState> {
    const newBranch = makeLocalBranch(branchName, commit.hash);
    const newBranches = this._workspace.branches.updateBranch(newBranch);
    const ws = this._workspace.addCommit(commit).setBranches(newBranches);

    return new WorkspaceManipulator<TState>(ws);
  }

  // TODO: Undo
  // TODO: Redo
}
