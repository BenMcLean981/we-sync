import { Commit } from './commit.js';
import { Memento } from '../memento/index.js';
import sha1 from 'sha1';
import { Command } from '../command/index.js';

export class CommandCommit<TState extends Memento> implements Commit<TState> {
  private readonly _hash: string;

  private readonly _parent: string;

  private readonly _command: Command<TState>;

  public constructor(parent: string, command: Command<TState>) {
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

  public get parents(): Set<string> {
    return new Set([this._parent]);
  }

  public apply(parents: Record<string, TState>): TState {
    if (!(this._parent in parents)) {
      throw new Error('Parent not provided.');
    }

    return this._command.apply(parents[this._parent]);
  }
}
