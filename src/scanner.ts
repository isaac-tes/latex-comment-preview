/**
 * Pure (vscode-free) LaTeX span scanner for Python sources.
 *
 * Tracks document state character-by-character:
 *   code → line comment (# … \n) / ordinary string / triple-quoted docstring
 * and inside comments/docstrings finds $...$ (inline) and $$...$$ (display)
 * math spans. Unlike the previous line-based scanner, both delimiters may
 * open and close on DIFFERENT lines inside a docstring — multi-line
 *
 *   $$
 *   T = \begin{pmatrix} ... \end{pmatrix}
 *   $$
 *
 * blocks and inline $...$ spanning a line break are found. In a `#` comment
 * math must still close before the newline (the comment ends there anyway).
 *
 * Ordinary string literals are skipped so `#` / `$` inside them are ignored;
 * an escaped `\$` is never a delimiter.
 */

export type SpanContext = "comment" | "docstring";

export interface RawSpan {
  /** The LaTeX source between the delimiters (trimmed, without the $ / $$). */
  tex: string;
  /** True for $$...$$ (display mode), false for $...$ (inline mode). */
  display: boolean;
  /** Zero-based line/column of the opening delimiter. */
  startLine: number;
  startCol: number;
  /** Zero-based line/column just past the closing delimiter. */
  endLine: number;
  endCol: number;
  /** Whether this span lives in a `#` comment or a triple-quoted docstring. */
  context: SpanContext;
}

export function scanLatexSpans(text: string): RawSpan[] {
  const spans: RawSpan[] = [];

  // Line-start offsets for offset → (line, col) conversion.
  const lineStarts: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") lineStarts.push(i + 1);
  }
  const posOf = (offset: number): { line: number; col: number } => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return { line: lo, col: offset - lineStarts[lo] };
  };

  type State = "code" | "comment" | "string" | "docstring";
  let state: State = "code";
  let strQuote = "";
  let docDelim = '"""';

  const n = text.length;
  let i = 0;
  while (i < n) {
    const ch = text[i];

    switch (state) {
      case "code": {
        if (ch === "#") {
          state = "comment";
          i++;
        } else if (
          text.startsWith('"""', i) ||
          text.startsWith("'''", i)
        ) {
          docDelim = text[i] === '"' ? '"""' : "'''";
          state = "docstring";
          i += 3;
        } else if (ch === '"' || ch === "'") {
          strQuote = ch;
          state = "string";
          i++;
        } else {
          i++;
        }
        break;
      }

      case "comment": {
        if (ch === "\n") {
          state = "code";
          i++;
        } else if (ch === "\\") {
          i += 2; // escaped char (e.g. \$) is not a delimiter
        } else if (ch === "$") {
          i = scanMath(text, i, "comment", spans, posOf);
        } else {
          i++;
        }
        break;
      }

      case "string": {
        if (ch === "\\") {
          i += 2;
        } else if (ch === strQuote) {
          state = "code";
          i++;
        } else if (ch === "\n") {
          state = "code"; // normal strings can't span lines
          i++;
        } else {
          i++;
        }
        break;
      }

      case "docstring": {
        if (text.startsWith(docDelim, i)) {
          state = "code";
          i += 3;
        } else if (ch === "\\") {
          i += 2; // escaped char is not a delimiter
        } else if (ch === "$") {
          i = scanMath(text, i, "docstring", spans, posOf);
        } else {
          i++;
        }
        break;
      }
    }
  }

  return spans;
}

/**
 * Scan a math span whose opening `$` (or `$$`) is at `open`. Appends the span
 * to `spans` if a closing delimiter is found and the content is non-empty.
 * Returns the index just past the closing delimiter, or just past the opening
 * delimiter if the span never closes (no span is produced then).
 */
function scanMath(
  text: string,
  open: number,
  context: SpanContext,
  spans: RawSpan[],
  posOf: (offset: number) => { line: number; col: number }
): number {
  const display = text[open + 1] === "$";
  const delimLen = display ? 2 : 1;
  const contentStart = open + delimLen;

  // In a `#` comment the span must close before the newline; in a docstring
  // it may span any number of lines.
  const stopAtNewline = context === "comment";
  const closeIdx = findMathClose(text, contentStart, display, stopAtNewline);
  if (closeIdx === -1) {
    return contentStart;
  }

  const tex = text.substring(contentStart, closeIdx).trim();
  const end = closeIdx + delimLen;
  if (tex.length > 0) {
    const startPos = posOf(open);
    const endPos = posOf(end);
    spans.push({
      tex,
      display,
      startLine: startPos.line,
      startCol: startPos.col,
      endLine: endPos.line,
      endCol: endPos.col,
      context,
    });
  }
  return end;
}

/** Find the closing $ (or $$) starting from `from`, or -1. */
function findMathClose(
  text: string,
  from: number,
  display: boolean,
  stopAtNewline: boolean
): number {
  let i = from;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (stopAtNewline && ch === "\n") {
      return -1;
    }
    if (ch === "\\") {
      i += 2; // an escaped \$ is not a delimiter
      continue;
    }
    if (ch === "$") {
      if (display) {
        if (text[i + 1] === "$") {
          return i;
        }
        i++; // a single $ inside a $$ block is fine, keep scanning
        continue;
      }
      return i;
    }
    i++;
  }
  return -1;
}
