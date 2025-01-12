export interface Branches {
  getAll(): ReadonlyArray<Branch>;

  getLocalBranch(name: string): LocalBranch;

  getRemoteBranch(name: string): RemoteBranch;

  containsLocalBranch(name: string): boolean;

  containsRemoteBranch(name: string): boolean;

  upsertBranch(branch: Branch): Branches;

  addBranch(branch: Branch): Branches;

  updateBranch(branch: Branch): Branches;
}

export type LocalBranch = {
  type: 'Local';

  name: string;

  head: string;
};

export function makeLocalBranch(name: string, head: string): LocalBranch {
  return {
    type: 'Local',
    name,
    head,
  };
}

export type RemoteBranch = {
  type: 'Remote';

  name: string;

  head: string;
};

export function makeRemoteBranch(name: string, head: string): RemoteBranch {
  return {
    type: 'Remote',
    name,
    head,
  };
}

export type Branch = LocalBranch | RemoteBranch;

export function isLocalBranch(branch: Branch): branch is LocalBranch {
  return branch.type === 'Local';
}

export function isRemoteBranch(branch: Branch): branch is RemoteBranch {
  return branch.type === 'Remote';
}
