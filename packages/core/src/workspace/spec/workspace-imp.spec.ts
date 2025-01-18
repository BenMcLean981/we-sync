import { type Snapshot } from '../../memento/snapshot.js';
import { type Memento } from '../../memento/memento.js';
import { type Equalable } from '../../equality/index.js';
import { MAIN_BRANCH, WorkspaceImp } from '../workspace-imp.js';
import { type Command } from '../../command/command.js';
import { CommandCommit } from '../../commit/command-commit.js';
import { InitialCommit } from '../../commit/initial-commit.js';
import { MergeCommit } from '../../commit/merge-commit.js';
import { makeLocalBranch } from '../../branches/branches.js';

describe('WorkspaceImp', () => {
  it('Initializes to an empty state with a name.', () => {
    const workspace = WorkspaceImp.makeNew<State>(new State(5));

    const state = workspace.getState(workspace.head.hash);

    expect(state.value).toBe(5);
  });

  it('Allows the state to have commands applied.', () => {
    let workspace = WorkspaceImp.makeNew(new State(5));
    const commit = new CommandCommit(workspace.head.hash, new SetCommand(6));

    workspace = workspace
      .addCommit(commit)
      .setBranches(
        workspace.branches.updateBranch(
          makeLocalBranch(MAIN_BRANCH, commit.hash)
        )
      );

    const state = workspace.getState(workspace.head.hash);

    expect(state.value).toBe(6);
  });

  describe('addCommit', () => {
    it('Throws an error for duplicate commit.', () => {
      const workspace = WorkspaceImp.makeNew(new State(5));
      const commit = new CommandCommit(workspace.head.hash, new SetCommand(6));

      expect(() =>
        workspace.addCommit(commit).addCommit(commit)
      ).toThrowError();
    });

    it('Throws an error for missing parent commit.', () => {
      const workspace = WorkspaceImp.makeNew(new State(5));
      const commit = new CommandCommit('123', new SetCommand(6));

      expect(() => workspace.addCommit(commit)).toThrowError();
    });

    it('Throws an error for duplicate initial commit.', () => {
      const workspace = WorkspaceImp.makeNew(new State(5));
      const commit = new InitialCommit(new State(6));

      expect(() => workspace.addCommit(commit)).toThrowError();
    });
  });

  describe('setBranches', () => {
    it('Throws an error for commit missing.', () => {
      const workspace = WorkspaceImp.makeNew(new State(5));

      expect(() =>
        workspace.setBranches(
          workspace.branches.updateBranch(makeLocalBranch(MAIN_BRANCH, '123'))
        )
      ).toThrowError();
    });
  });

  it('Handles merge commits correctly.', () => {
    const w = WorkspaceImp.makeNew(new State(5));
    const c1 = new CommandCommit(w.head.hash, new SetCommand(6));
    const c2 = new CommandCommit(w.head.hash, new SetCommand(7));

    const m1 = new MergeCommit<State>(c1.hash, c2.hash, c1.hash);
    const m2 = new MergeCommit<State>(c1.hash, c2.hash, c2.hash);

    const w1 = w
      .addCommit(c1)
      .addCommit(c2)
      .addCommit(m1)
      .setBranches(
        w.branches.updateBranch(makeLocalBranch(MAIN_BRANCH, m1.hash))
      );
    const w2 = w
      .addCommit(c1)
      .addCommit(c2)
      .addCommit(m2)
      .setBranches(
        w.branches.updateBranch(makeLocalBranch(MAIN_BRANCH, m2.hash))
      );

    expect(w1.getState(w1.head.hash).value).toBe(6);
    expect(w2.getState(w2.head.hash).value).toBe(7);
  });
});

class State implements Memento, Equalable {
  private readonly _value: number;

  public constructor(value: number) {
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }

  public getSnapshot(): StateSnapshot {
    return {
      value: this.value,
    };
  }

  public equals(other: unknown) {
    if (other instanceof State) {
      return this.value === other.value;
    } else {
      return false;
    }
  }
}

class SetCommand implements Command<State> {
  private readonly _value: number;

  constructor(value: number) {
    this._value = value;
  }

  public apply(): State {
    return new State(this._value);
  }

  public getSnapshot(): SetCommandSnapshot {
    return {
      type: 'SetCommand',
      value: this._value,
    };
  }
}

interface SetCommandSnapshot extends Snapshot {
  type: 'SetCommand';

  value: number;
}

interface StateSnapshot extends Snapshot {
  value: number;
}
