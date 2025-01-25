import { type Workspace } from '../workspace/index.js';
import { type RemoteFetcher } from '../remote-fetcher/index.js';
import { makeLocalBranch, makeRemoteBranch } from '../branches/index.js';
import {
  type Differences,
  getAllPreviousCommits,
  getDifferences,
} from './differences.js';

export type Conflict<TState> = {
  local: TState;
  remote: TState;
};

export type SynchronizationResult<TState> =
  | Workspace<TState>
  | Conflict<TState>;

export async function fetchAndSynchronizeBranch<TState>(
  workspace: Workspace<TState>,
  fetcher: RemoteFetcher<TState>,
  branchName: string
): Promise<SynchronizationResult<TState>> {
  const refsUpdated = await updateRemoteHead(workspace, fetcher, branchName);
  const ready = await ensureBranchesCreated(refsUpdated, fetcher, branchName);
  const fetched = await fetch(ready, branchName, fetcher);

  return synchronizeBranch(fetched, fetcher, branchName);
}

async function updateRemoteHead<TState>(
  workspace: Workspace<TState>,
  fetcher: RemoteFetcher<TState>,
  branchName: string
) {
  const remoteBranch = await fetcher.getBranch(branchName);

  if (remoteBranch === undefined) {
    return workspace;
  } else {
    const newBranches = workspace.branches.updateBranch(
      makeRemoteBranch(branchName, remoteBranch.head)
    );

    return workspace.setBranches(newBranches);
  }
}

async function ensureBranchesCreated<TState>(
  workspace: Workspace<TState>,
  fetcher: RemoteFetcher<TState>,
  branchName: string
): Promise<Workspace<TState>> {
  if (!workspace.branches.containsLocalBranch(branchName)) {
    // TODO: Support creating new branches.

    throw new Error(`Missing local branch "${branchName}"`);
  } else if (!workspace.branches.containsRemoteBranch(branchName)) {
    const local = workspace.branches.getLocalBranch(branchName);
    const hashes = getAllPreviousCommits(workspace, local.head);
    const commits = [...hashes].map((h) => workspace.getCommit(h));

    await fetcher.push(commits, branchName, local.head);

    return workspace.setBranches(
      workspace.branches.upsertBranch(makeRemoteBranch(branchName, local.head))
    );
  } else {
    return workspace;
  }
}

async function fetch<TState>(
  workspace: Workspace<TState>,
  branchName: string,
  fetcher: RemoteFetcher<TState>
) {
  const local = workspace.branches.getLocalBranch(branchName);

  const remoteAfter = await fetcher.fetch(branchName, local.head);

  return workspace.addCommits(remoteAfter);
}

async function synchronizeBranch<TState>(
  workspace: Workspace<TState>,
  fetcher: RemoteFetcher<TState>,
  branchName: string
): Promise<SynchronizationResult<TState>> {
  const differences = getDifferences(workspace, branchName);

  if (isRemoteAhead(differences)) {
    return fastForward(workspace, branchName);
  } else if (isLocalAhead(differences)) {
    return await push(workspace, fetcher, branchName);
  } else if (noDifference(differences)) {
    return workspace;
  } else if (isInConflict(differences)) {
    return getConflict(workspace, branchName);
  } else {
    // Will never happen.

    throw new Error('Something went wrong, invalid differences.');
  }
}

function noDifference(differences: Differences): boolean {
  return (
    differences.localDifference.size === 0 &&
    differences.remoteDifference.size === 0
  );
}

function isRemoteAhead(differences: Differences): boolean {
  return (
    differences.localDifference.size === 0 &&
    differences.remoteDifference.size !== 0
  );
}

function isLocalAhead(differences: Differences): boolean {
  return (
    differences.localDifference.size !== 0 &&
    differences.remoteDifference.size === 0
  );
}

function isInConflict(differences: Differences): boolean {
  return (
    differences.localDifference.size !== 0 &&
    differences.remoteDifference.size !== 0
  );
}

function fastForward<TState>(
  workspace: Workspace<TState>,
  branchName: string
): Workspace<TState> {
  const differences = getDifferences(workspace, branchName);

  if (!isRemoteAhead(differences)) {
    throw new Error('Cannot fast forward, remote not ahead.');
  }

  const remoteBranch = workspace.branches.getRemoteBranch(branchName);
  const newBranches = workspace.branches.updateBranch(
    makeLocalBranch(branchName, remoteBranch.head)
  );

  return workspace.setBranches(newBranches);
}

async function push<TState>(
  workspace: Workspace<TState>,
  fetcher: RemoteFetcher<TState>,
  branchName: string
) {
  const differences = getDifferences(workspace, branchName);

  if (!isLocalAhead(differences)) {
    throw new Error('Cannot push, local is missing commits.');
  }

  const local = workspace.branches.getLocalBranch(branchName);
  const commits = [...differences.localDifference].map((hash) =>
    workspace.getCommit(hash)
  );

  await fetcher.push(commits, branchName, local.head);

  const newRemote = makeRemoteBranch(branchName, local.head);
  const newBranches = workspace.branches.updateBranch(newRemote);

  return workspace.setBranches(newBranches);
}

function getConflict<TState>(
  workspace: Workspace<TState>,
  branchName: string
): Conflict<TState> {
  const localBranch = workspace.branches.getLocalBranch(branchName);
  const remoteBranch = workspace.branches.getRemoteBranch(branchName);

  const local = workspace.getState(localBranch.head);
  const remote = workspace.getState(remoteBranch.head);

  return {
    local,
    remote,
  };
}
