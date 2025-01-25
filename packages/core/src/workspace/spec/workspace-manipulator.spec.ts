import { describe, expect, it } from 'vitest';
import { SetCommand, TestState } from './test-state.js';
import { MAIN_BRANCH, WorkspaceImp } from '../workspace-imp.js';
import { CommandCommit } from '../../commit/index.js';
import { makeLocalBranch } from '../../branches/index.js';
import { WorkspaceManipulator } from '../workspace-manipulator.js';

describe('WorkspaceManipulator', () => {
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
});
