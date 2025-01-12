import {
  Branch,
  Branches,
  isLocalBranch,
  isRemoteBranch,
  LocalBranch,
  RemoteBranch,
} from './branches.js';

export class BranchesImp implements Branches {
  private readonly _locals: Record<string, LocalBranch>;

  private readonly _remotes: Record<string, RemoteBranch>;

  private constructor(
    locals: Record<string, LocalBranch>,
    remotes: Record<string, RemoteBranch>
  ) {
    this._locals = locals;
    this._remotes = remotes;
  }

  public static makeNew(branch: LocalBranch): Branches {
    const locals = { [branch.name]: branch };
    const remotes = {};

    return new BranchesImp(locals, remotes);
  }

  public getAll(): ReadonlyArray<Branch> {
    // TODO: Test this.

    return [...Object.values(this._locals), ...Object.values(this._remotes)];
  }

  public containsLocalBranch(name: string): boolean {
    return name in this._locals;
  }

  public containsRemoteBranch(name: string): boolean {
    return name in this._remotes;
  }

  public getLocalBranch(name: string): LocalBranch {
    const result = this._locals[name];

    if (result === undefined) {
      throw new Error(`No local branch with name "${name}" found.`);
    }

    return result;
  }

  public getRemoteBranch(name: string): RemoteBranch {
    const result = this._remotes[name];

    if (result === undefined || !isRemoteBranch(result)) {
      throw new Error(`No remote branch with name "${name}" found.`);
    }

    return result;
  }

  public upsertBranch(branch: Branch): Branches {
    if (
      (isLocalBranch(branch) && this.containsLocalBranch(branch.name)) ||
      (isRemoteBranch(branch) && this.containsRemoteBranch(branch.name))
    ) {
      return this.updateBranch(branch);
    } else {
      return this.addBranch(branch);
    }
  }

  public addBranch(branch: Branch): Branches {
    if (isLocalBranch(branch)) {
      return this.addLocalBranch(branch);
    } else {
      return this.addRemoteBranch(branch);
    }
  }

  public updateBranch(branch: Branch): Branches {
    if (isLocalBranch(branch)) {
      return this.updateLocalBranch(branch);
    } else {
      return this.updateRemoteBranch(branch);
    }
  }

  private addLocalBranch(branch: LocalBranch) {
    if (branch.name in this._locals) {
      throw new Error(`Already have branch "${branch.name}".`);
    }

    const locals = {
      ...this._locals,
      [branch.name]: branch,
    };

    return new BranchesImp(locals, this._remotes);
  }

  private addRemoteBranch(branch: RemoteBranch) {
    if (branch.name in this._remotes) {
      throw new Error(`Already have branch "${branch.name}".`);
    }

    const remotes = {
      ...this._remotes,
      [branch.name]: branch,
    };

    return new BranchesImp(this._locals, remotes);
  }

  private updateLocalBranch(branch: LocalBranch) {
    if (!(branch.name in this._locals)) {
      throw new Error(`Missing branch "${branch.name}".`);
    }

    const locals = {
      ...this._locals,
      [branch.name]: branch,
    };

    return new BranchesImp(locals, this._remotes);
  }

  private updateRemoteBranch(branch: RemoteBranch) {
    if (!(branch.name in this._remotes)) {
      throw new Error(`Missing branch "${branch.name}".`);
    }

    const remotes = {
      ...this._remotes,
      [branch.name]: branch,
    };

    return new BranchesImp(this._locals, remotes);
  }
}
