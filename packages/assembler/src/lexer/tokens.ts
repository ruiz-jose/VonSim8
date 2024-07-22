import type { Position } from "@vonsim/common/position";

import type { Keyword } from "../types";

export type TokenType =
  // Single-character tokens.
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACKET"
  | "RIGHT_BRACKET"
  | "COMMA"
  | "QUESTION_MARK"
  | "PLUS"
  | "MINUS"
  | "ASTERISK"
  // Literals.
  | "IDENTIFIER"
  | "LABEL"
  | "CHARACTER"
  | "STRING"
  | "NUMBER"
  // Keywords.
  | Keyword
  // ...
  | "EOL"
  | "EOF";

/**
 * A token produced by the lexer.
 *
 * ---
 * This class is: IMMUTABLE
 */
export class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly position: Position;

  constructor(type: TokenType, lexeme: string, position: Position) {
    this.type = type;
    this.lexeme = lexeme;
    this.position = position;
  }

  toJSON() {
    return {
      type: this.type,
      lexeme: this.lexeme,
      position: this.position.toJSON(),
    };
  }
}
