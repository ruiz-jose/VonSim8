/**
 * A position in the source code.
 * It's represented by a start and end index.
 *
 * ---
 * This class is: IMMUTABLE
 */
export class Position {
  readonly start: number;
  readonly end: number;

  constructor(start: number, end?: number) {
    this.start = start | 0;
    this.end = (end ?? start) | 0;
  }

  get range(): [start: number, end: number] {
    return [this.start, this.end];
  }

  toString() {
    let str = `${this.start}`;
    if (this.end !== this.start) str += `:${this.end}`;
    return str;
  }

  /**
   * Merge multiple positions into one that contains all of them.
   */
  static merge(...positions: (Position | null | undefined)[]): Position {
    const arr = positions.filter(Boolean);
    if (arr.length === 0) throw new Error("Cannot merge 0 positions");
    let start = arr[0].start;
    let end = arr[0].end;
    for (const position of arr) {
      if (position.start < start) start = position.start;
      if (position.end > end) end = position.end;
    }

    return new Position(start, end);
  }

  toJSON() {
    return this.range;
  }
}
