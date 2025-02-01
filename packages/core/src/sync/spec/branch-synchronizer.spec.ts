import { beforeEach, describe, expect, it } from 'vitest';
import {
  fetchAndSynchronizeBranch,
  getHeadHash,
  isMerged,
  type SynchronizationResult,
  type Workspace,
  WorkspaceImp,
} from '../../workspace/index.js';
import { SetCommand, TestState } from '../../test-state/index.js';
import { WorkspaceBasedRemoteFetcher } from '../../remote-fetcher/workspace-based-remote-fetcher.js';
import { WorkspaceManipulator } from '../../workspace/workspace-manipulator.js';

describe('fetchAndSynchronizeBranch', () => {
  let base: Workspace<TestState>;

  let ahead1: Workspace<TestState>;
  let ahead2: Workspace<TestState>;

  beforeEach(() => {
    base = WorkspaceImp.makeNew(new TestState(5));

    ahead1 = new WorkspaceManipulator(base).apply(new SetCommand(6)).workspace;
    ahead2 = new WorkspaceManipulator(base).apply(new SetCommand(7)).workspace;
  });

  it('Throws an error for local branch missing.', () => {
    const fetcher = new WorkspaceBasedRemoteFetcher(base);

    expect(() =>
      fetchAndSynchronizeBranch(base, fetcher, 'foo')
    ).rejects.toThrowError();
  });

  it('Creates a branch on the remote when missing.', async () => {
    const fetcher = new WorkspaceBasedRemoteFetcher<TestState>();

    const result = await fetchAndSynchronizeBranch(base, fetcher);

    const expectedHead = getHeadHash(base);

    expectMerged(result, fetcher.workspace, expectedHead);
  });

  it('Does nothing when there is no difference.', async () => {
    const fetcher = new WorkspaceBasedRemoteFetcher(ahead1);

    const result = await fetchAndSynchronizeBranch(ahead1, fetcher);

    const expectedHead = getHeadHash(ahead1);

    expectMerged(result, fetcher.workspace, expectedHead);
  });

  it('Pushes missing commits when local ahead.', async () => {
    const fetcher = new WorkspaceBasedRemoteFetcher(base);

    const result = await fetchAndSynchronizeBranch(ahead1, fetcher);

    const expectedHead = getHeadHash(ahead1);

    expectMerged(result, fetcher.workspace, expectedHead);
  });

  it('Pulls missing commits when remote ahead.', async () => {
    const fetcher = new WorkspaceBasedRemoteFetcher(ahead1);

    const result = await fetchAndSynchronizeBranch(base, fetcher);

    const expectedHead = getHeadHash(ahead1);

    expectMerged(result, fetcher.workspace, expectedHead);
  });

  it.todo('Returns a merge conflict.');

  function expectMerged(
    result: SynchronizationResult<TestState>,
    remote: Workspace<TestState>,
    expectedHash: string
  ): void {
    if (!isMerged(result)) {
      expect.fail('Not merged.');
    }

    expect(getHeadHash(result)).toBe(expectedHash);
    expect(getHeadHash(remote)).toBe(expectedHash);
  }
});
