import { type Commit } from './commit.js';
import { type Memento } from '../memento/index.js';
import sha1 from 'sha1';

export class MergeCommit<TState extends Memento> implements Commit<TState> {
  private readonly _hash: string;

  private readonly _target: string;

  private readonly _source: string;

  private readonly _selection: string;

  public constructor(target: string, source: string, selection: string) {
    MergeCommit.validate(target, source, selection);

    this._hash = sha1(
      JSON.stringify({
        target,
        source,
        selection,
      })
    );

    this._target = target;
    this._source = source;
    this._selection = selection;
  }

  public get hash(): string {
    return this._hash;
  }

  public get parents(): Set<string> {
    return new Set([this._target, this._source]);
  }

  private static validate(target: string, source: string, selection: string) {
    if (target === source) {
      throw new Error('Cannot merge target into source.');
    }

    if (selection !== target && selection !== source) {
      throw new Error('Merge commit has invalid selection.');
    }
  }

  public apply(parents: Record<string, TState>): TState {
    if (!(this._selection in parents)) {
      throw new Error('Parent not provided.');
    }

    return parents[this._selection];
  }
}
