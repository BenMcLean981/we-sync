import { type Workspace } from '../workspace/index.js';

export type Differences = {
  /**
   * The hashes on local that are not on remote.
   */
  localDifference: Set<string>;

  /**
   * The hashes on remote that are not on local.
   */
  remoteDifference: Set<string>;
};

export function getDifferences<TState>(
  workspace: Workspace<TState>,
  branchName: string
): Differences {
  const localBranch = workspace.branches.getLocalBranch(branchName);
  const remoteBranch = workspace.branches.getRemoteBranch(branchName);

  const allLocalCommits = getAllPreviousCommits(workspace, localBranch.head);
  const allRemoteCommits = getAllPreviousCommits(workspace, remoteBranch.head);

  const localDifference = difference(allLocalCommits, allRemoteCommits);
  const remoteDifference = difference(allRemoteCommits, allLocalCommits);

  return {
    localDifference,
    remoteDifference,
  };
}

export function getAllPreviousCommits<TState>(
  workspace: Workspace<TState>,
  hash: string,
  stop?: string
): Set<string> {
  if (hash === stop) {
    return new Set();
  }

  const visited = new Set<string>();
  const toVisit = [hash];

  while (toVisit.length > 0) {
    const nextHash = toVisit.pop() as string;

    const commit = workspace.getCommit(nextHash);

    [...commit.parents]
      .filter((p) => !visited.has(p) && p !== stop)
      .forEach((p) => {
        toVisit.push(p);
      });

    visited.add(nextHash);
  }

  return visited;
}

function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const items = [...setA].filter((a) => !setB.has(a));

  return new Set(items);
}
