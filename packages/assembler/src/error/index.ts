import { initTranlate, Language, LocaleCode, LocaleContext } from "@vonsim/common/i18n";
import { Position } from "@vonsim/common/position";

import { english } from "./messages/english";
import { spanish } from "./messages/spanish";

export type Messages = typeof english;

const translate = initTranlate<Messages>({
  en: english,
  es: spanish,
});

export type AssemblerErrorCode = LocaleCode<Messages>;
export type AssemblerErrorContext<Code extends AssemblerErrorCode> = LocaleContext<Messages, Code>;

/**
 * An error that can be thrown by the assembly.
 *
 * The basic idea of the error system is that each error has a code and maybe some parameters.
 * This way, the error messages can be translated to different languages.
 *
 * @see {@link initTranlate}
 *
 * @example
 * new AssemblerError("double-memory-access")
 * new AssemblerError("label-not-found", label)
 */
export class AssemblerError<Code extends AssemblerErrorCode> extends Error {
  public readonly code: Code;
  private readonly context: AssemblerErrorContext<Code>;
  public position: Position | null;

  constructor(code: Code, ...context: AssemblerErrorContext<Code>) {
    super();
    this.code = code;
    this.context = context;
    this.position = null;

    if (code === "unexpected-error") {
      console.error("[Unexpected Assembler Error]", ...context);
    }
  }

  /**
   * Add a position to the error.
   * @param position A position or something that has a position.
   * @returns
   */
  at(position?: Position | { position: Position } | { meta: { position: Position } }) {
    if (position) {
      if (position instanceof Position) this.position = position;
      else if ("position" in position) this.position = position.position;
      else if ("meta" in position) this.position = position.meta.position;
    }
    return this;
  }

  translate(lang: Language) {
    return translate(lang, this.code, ...this.context);
  }

  // Just for internal use, should never be shown to the user.
  get message() {
    let message = this.translate("en");
    if (this.position) message += ` (${this.position})`;

    return message;
  }

  toString() {
    return this.message;
  }

  static from(err: unknown): AssemblerError<any> {
    if (err instanceof AssemblerError) return err;
    else return new AssemblerError("unexpected-error", err);
  }
}
