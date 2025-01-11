import sha1 from 'sha1';
import { Memento } from '../memento/memento.js';
import { Commit } from './commit.js';

export class InitialCommit<TState extends Memento> implements Commit<TState> {
  private readonly _hash: string;

  private readonly _state: TState;

  public constructor(state: TState) {
    this._hash = sha1(
      JSON.stringify({
        state: state.getSnapshot(),
      })
    );
    this._state = state;
  }

  public get hash(): string {
    return this._hash;
  }

  public get parent(): string | null {
    return null;
  }

  public apply(): TState {
    return this._state;
  }
}
