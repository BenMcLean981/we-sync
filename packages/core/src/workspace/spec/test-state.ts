import type { Memento, Snapshot } from '../../memento/index.js';
import type { Equalable } from '../../equality/index.js';
import type { Command } from '../../command/index.js';

export class TestState implements Memento, Equalable {
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
    if (other instanceof TestState) {
      return this.value === other.value;
    } else {
      return false;
    }
  }
}

export class SetCommand implements Command<TestState> {
  private readonly _value: number;

  constructor(value: number) {
    this._value = value;
  }

  public apply(): TestState {
    return new TestState(this._value);
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
