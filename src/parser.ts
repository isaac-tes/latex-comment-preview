import * as vscode from "vscode";
import { scanLatexSpans, RawSpan, SpanContext } from "./scanner";

export type { SpanContext };

export interface LatexSpan {
  /** The LaTeX source between the delimiters (without the $ / $$). */
  tex: string;
  /** True for $$...$$ (display mode), false for $...$ (inline mode). */
  display: boolean;
  /** Range covering the full delimited span, including the $ delimiters. */
  range: vscode.Range;
  /** Whether this span lives in a `#` comment or a triple-quoted docstring. */
  context: SpanContext;
}

/**
 * Find all renderable LaTeX spans inside comments of a Python document.
 *
 * Scope:
 *  - `#` line comments (the part after the first unquoted #)
 *  - triple-quoted docstrings (''' ''' and """ """), including multi-line
 *
 * Only text between $...$ (inline) or $$...$$ (display) delimiters is returned,
 * so plain prose in a comment is never treated as math. Both delimiters may
 * open and close on different lines inside a docstring (multi-line $$ blocks,
 * inline $...$ spanning a line break); in a `#` comment math must close
 * before the newline.
 */
export function findLatexSpans(doc: vscode.TextDocument): LatexSpan[] {
  return scanLatexSpans(doc.getText()).map(toLatexSpan);
}

function toLatexSpan(raw: RawSpan): LatexSpan {
  return {
    tex: raw.tex,
    display: raw.display,
    range: new vscode.Range(
      raw.startLine,
      raw.startCol,
      raw.endLine,
      raw.endCol
    ),
    context: raw.context,
  };
}

/** Return the LaTeX span whose range contains `position`, if any. */
export function spanAt(
  spans: LatexSpan[],
  position: vscode.Position
): LatexSpan | undefined {
  return spans.find((s) => s.range.contains(position));
}
