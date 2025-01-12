import { Commit } from '../commit/commit.js';

export interface RemoteFetcher<TState> {
  /**
   * Fetch the commits ahead of the given hash.
   *
   * @param branchName Branch to fetch commits from.
   * @param hash Hash to fetch commits after.
   */
  fetch(
    branchName: string,
    hash: string
  ): Promise<ReadonlyArray<Commit<TState>>>;

  push(commits: ReadonlyArray<Commit<TState>>): Promise<void>;

  createRemote(
    branchName: string,
    commits: ReadonlyArray<Commit<TState>>,
    head: string
  ): Promise<void>;
}
