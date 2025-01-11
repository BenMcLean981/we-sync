import { Commit } from './commit.js';
import { Memento } from '../memento/index.js';
import sha1 from 'sha1';
import { Command } from '../command/index.js';

export class CommandCommit<TState extends Memento> implements Commit<TState> {
  private readonly _hash: string;

  private readonly _parent: string | null;

  private readonly _command: Command<TState>;

  public constructor(parent: string | null, command: Command<TState>) {
    this._hash = sha1(
      JSON.stringify({
        parent,
        command: command.getSnapshot(),
      })
    );
    this._parent = parent;
    this._command = command;
  }

  public get hash(): string {
    return this._hash;
  }

  public get parent(): string | null {
    return this._parent;
  }

  public apply(state: TState): TState {
    return this._command.apply(state);
  }
}
