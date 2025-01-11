import { type Snapshot } from '../../memento/snapshot.js';
import { type Memento } from '../../memento/memento.js';
import { type Equalable } from '../../equality/index.js';
import { WorkspaceImp } from '../workspace-imp.js';
import { type Command } from '../../command/command.js';
import { CommandCommit } from '../../commit/command-commit.js';
import { InitialCommit } from '../../commit/initial-commit.js';

describe('WorkspaceImp', () => {
  it('Initializes to an empty state with a name.', () => {
    const workspace = WorkspaceImp.makeNew<State>(new State(5));

    const state = workspace.getState(workspace.head.hash);

    expect(state.value).toBe(5);
  });

  it('Allows the document to be renamed.', () => {
    let workspace = WorkspaceImp.makeNew(new State(5));
    const commit = new CommandCommit(workspace.head.hash, new SetCommand(6));

    workspace = workspace.addCommit(commit).setHead(commit.hash);

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

  describe('setHead', () => {
    it('Throws an error for commit missing.', () => {
      const workspace = WorkspaceImp.makeNew(new State(5));

      expect(() => workspace.setHead('123')).toThrowError();
    });
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
