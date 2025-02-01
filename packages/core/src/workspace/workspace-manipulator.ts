import { type Workspace } from './workspace.js';
import {
  CommandCommit,
  type Commit,
  InitialCommit,
  RevertCommit,
} from '../commit/index.js';
import { getHeadHash, MAIN_BRANCH } from './workspace-imp.js';
import { makeLocalBranch } from '../branches/index.js';
import { type Command } from '../command/index.js';
import { type Memento } from '../memento/index.js';
import { getAllPreviousCommitsHashes } from '../sync/differences.js';

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

  public undo(): WorkspaceManipulator {
    const commitToUndo = this.findCommitToUndo();
    const revert = new RevertCommit(
      commitToUndo.hash,
      this._workspace.head.hash
    );

    return this.commit(revert);
  }

  public redo(): WorkspaceManipulator {
    const commitToRedo = this.findCommitToRedo();
    const revert = new RevertCommit(
      commitToRedo.hash,
      this._workspace.head.hash
    );

    return this.commit(revert);
  }

  private findCommitToUndo(): Commit<TState> {
    const chain = getAllPreviousCommitsHashes(
      this._workspace,
      getHeadHash(this._workspace)
    );

    const commitToUndo = chain.find((c) => this.isUndoable(c, chain));
    if (commitToUndo === undefined) {
      throw new Error('No commits to undo.');
    }

    return commitToUndo;
  }

  private isUndoable(
    c: Commit<TState>,
    chain: ReadonlyArray<Commit<TState>>
  ): boolean {
    if (c instanceof InitialCommit) {
      return false;
    } else {
      return !this.isUndo(c, chain);
    }
  }

  private findCommitToRedo(): Commit<TState> {
    const chain = getAllPreviousCommitsHashes(
      this._workspace,
      getHeadHash(this._workspace)
    );

    const commits = takeWhile(chain, (c) => c instanceof RevertCommit);

    const commitToRedo = commits.find(
      (c) => c instanceof RevertCommit && this.isUndo(c, chain)
    );
    if (commitToRedo === undefined) {
      throw new Error('No commits to redo.');
    }

    return commitToRedo;
  }

  private isUndo(commit: Commit<TState>, chain: ReadonlyArray<Commit<TState>>) {
    const target = this.getTarget(commit);

    return this.isUndone(target, chain);
  }

  private getTarget(commit: Commit<TState>): Commit<TState> {
    if (commit instanceof RevertCommit) {
      const target = this._workspace.getCommit(commit.target);

      return this.getTarget(target);
    } else {
      return commit;
    }
  }

  private isUndone(
    target: Commit<TState>,
    commits: ReadonlyArray<Commit<TState>>
  ): boolean {
    const times = this.getTimesUndone(target, commits);

    return isOdd(times);
  }

  private getTimesUndone(
    target: Commit<TState>,
    commits: ReadonlyArray<Commit<TState>>,
    times = 0
  ): number {
    const revert = this.findRevert(target, commits);

    if (revert === undefined) {
      return times;
    } else {
      return this.getTimesUndone(revert, commits, times + 1);
    }
  }

  private findRevert(
    target: Commit<TState>,
    commits: ReadonlyArray<Commit<TState>>
  ): Commit<TState> | undefined {
    return commits.find((c) => this.undoes(c, target));
  }

  /**
   * Returns whether @param commit undoes @param target
   */
  private undoes(commit: Commit<TState>, target: Commit<TState>): boolean {
    if (commit instanceof RevertCommit) {
      return commit.target === target.hash;
    } else {
      return false;
    }
  }
}
