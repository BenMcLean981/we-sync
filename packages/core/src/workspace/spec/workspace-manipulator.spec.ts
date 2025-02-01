import { describe, expect, it } from 'vitest';
import { SetCommand, TestState } from './test-state.js';
import {
  getHead,
  getHeadHash,
  MAIN_BRANCH,
  WorkspaceImp,
} from '../workspace-imp.js';
import { CommandCommit, RevertCommit } from '../../commit/index.js';
import { makeLocalBranch } from '../../branches/index.js';
import { WorkspaceManipulator } from '../workspace-manipulator.js';

describe('WorkspaceManipulator', () => {
  let manipulator: WorkspaceManipulator<TestState>;
  let c1: CommandCommit<TestState>;
  let c2: CommandCommit<TestState>;

  beforeEach(() => {
    const workspace = WorkspaceImp.makeNew(new TestState(5));

    const initialHash = workspace.branches.getLocalBranch(MAIN_BRANCH).head;

    c1 = new CommandCommit(initialHash, new SetCommand(6));
    c2 = new CommandCommit(c1.hash, new SetCommand(7));

    manipulator = new WorkspaceManipulator(workspace).commit(c1).commit(c2);
  });

  describe('commit', () => {
    it('Adds the commit and updates the head.', () => {
      const ws = WorkspaceImp.makeNew(new TestState(5));

      const local = ws.branches.getLocalBranch(MAIN_BRANCH);

      const commit = new CommandCommit(local.head, new SetCommand(6));

      const expected = ws
        .addCommit(commit)
        .setBranches(
          ws.branches.updateBranch(makeLocalBranch(MAIN_BRANCH, commit.hash))
        );

      const manipulator = new WorkspaceManipulator(ws).commit(commit);

      const actual = manipulator.workspace;

      expect(actual.equals(expected)).toBe(true);
    });
  });

  describe('undo', () => {
    it('Undoes a commit.', () => {
      const undone = manipulator.undo();
      const expected = manipulator.commit(
        new RevertCommit(
          getHeadHash(manipulator.workspace),
          getHeadHash(manipulator.workspace)
        )
      ).workspace;

      expect(undone.workspace.equals(expected)).toBe(true);
    });

    it('Undoes two commits.', () => {
      const undoneTwice = manipulator.undo().undo();

      const expectedRevert1 = new RevertCommit<TestState>(c2.hash, c2.hash);
      const expectedRevert2 = new RevertCommit<TestState>(
        c1.hash,
        expectedRevert1.hash
      );
      const expected = manipulator
        .commit(expectedRevert1)
        .commit(expectedRevert2).workspace;

      expect(undoneTwice.workspace.equals(expected)).toBe(true);
    });

    it('Throws an error when there is nothing to undo.', () => {
      manipulator = manipulator.undo().undo();

      expect(() => manipulator.undo()).toThrowError();
    });

    it('Undoes a redo.', () => {
      const ac = manipulator.undo().redo().undo();

      let ex = manipulator.commit(
        new RevertCommit(
          getHeadHash(manipulator.workspace),
          getHeadHash(manipulator.workspace)
        )
      );
      ex = ex.commit(
        new RevertCommit(getHeadHash(ex.workspace), getHeadHash(ex.workspace))
      );
      ex = ex.commit(
        new RevertCommit(getHeadHash(ex.workspace), getHeadHash(ex.workspace))
      );

      expect(ac.workspace.equals(ex.workspace)).toBe(true);
    });
  });

  describe('redo', () => {
    it('Throws an error if there are no undos.', () => {
      expect(() => manipulator.redo()).toThrowError();
    });

    it('Redoes an undo.', () => {
      manipulator = manipulator.undo();

      const redone = manipulator.redo();

      const ex = manipulator.commit(
        new RevertCommit(
          getHeadHash(manipulator.workspace),
          getHeadHash(manipulator.workspace)
        )
      );

      expect(redone.workspace.equals(ex.workspace)).toBe(true);
    });

    it('Redoes two undos.', () => {
      manipulator = manipulator.undo();
      const u1 = getHead(manipulator.workspace);

      manipulator = manipulator.undo();

      const redone = manipulator.redo();
      const redoneTwice = redone.redo();

      let ex = manipulator.commit(
        new RevertCommit(
          getHeadHash(manipulator.workspace),
          getHeadHash(manipulator.workspace)
        )
      );
      ex = ex.commit(new RevertCommit(u1.hash, getHeadHash(ex.workspace)));

      expect(redoneTwice.workspace.equals(ex.workspace)).toBe(true);
    });

    it('Throws an error when there is nothing left to redo.', () => {
      manipulator = manipulator.undo();
      manipulator = manipulator.undo();

      manipulator = manipulator.redo();
      manipulator = manipulator.redo();

      expect(() => manipulator.redo()).toThrowError();
    });

    it('Throws an error when there are commits between undo and head.', () => {
      manipulator = manipulator.undo();
      manipulator = manipulator.commit(
        new CommandCommit(
          getHeadHash(manipulator.workspace),
          new SetCommand(10)
        )
      );

      expect(() => manipulator.redo()).toThrowError();
    });
  });
});
