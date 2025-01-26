import { describe, expect, it } from 'vitest';
import {
  fetchAndSynchronizeBranch,
  MAIN_BRANCH,
  WorkspaceImp,
} from '../../workspace/index.js';
import { TestState } from '../../workspace/spec/test-state.js';
import { WorkspaceBasedRemoteFetcher } from '../../remote-fetcher/workspace-based-remote-fetcher.js';

describe('fetchAndSynchronizeBranch', () => {
  it('Throws an error for local branch missing.', () => {
    const ws = WorkspaceImp.makeNew(new TestState(5));

    const fetcher = new WorkspaceBasedRemoteFetcher(ws);

    expect(() =>
      fetchAndSynchronizeBranch(ws, fetcher, 'foo')
    ).rejects.toThrowError();
  });

  it('Creates a branch on the remote when missing.', async () => {
    const ws = WorkspaceImp.makeNew(new TestState(5));

    const fetcher = new WorkspaceBasedRemoteFetcher();

    await fetchAndSynchronizeBranch(ws, fetcher, MAIN_BRANCH);
  });

  it.todo('Does nothing when there is no difference.');

  it.todo('Pushes missing commits when local ahead.');

  it.todo('Pulls missing commits when remote ahead.');

  it.todo('Returns a merge conflict.');
});
