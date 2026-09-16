import * as assert from "assert";
import { scanLatexSpans } from "../src/scanner";

function texs(src: string): string[] {
  return scanLatexSpans(src).map((s) => s.tex);
}

/** The failing case from test_katex.py: a $$ block spanning multiple lines. */
const MULTILINE_DISPLAY = [
  'r"""',
  "$$",
  "T = \\begin{pmatrix}",
  "    f_{A,+} & 0 \\\\",
  "    f_{B,+} & 0 \\\\",
  "\\end{pmatrix} \\in \\mathbb{C}^{4 \\times 2}.",
  "$$",
  '"""',
].join("\n");

/** Inline $...$ spanning a line break inside a docstring. */
const MULTILINE_INLINE = [
  '"""',
  "Because the GPE eigenvalue satisfies $\\mu = \\langle f|H +",
  "2Un\\,D|f\\rangle = \\mu_\\mathrm{eff}$, it is self-consistent.",
  '"""',
].join("\n");

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test("multi-line $$ block in docstring is one display span", () => {
  const spans = scanLatexSpans(MULTILINE_DISPLAY);
  assert.strictEqual(spans.length, 1);
  const s = spans[0];
  assert.strictEqual(s.display, true);
  assert.strictEqual(s.context, "docstring");
  assert.ok(s.tex.includes("\\begin{pmatrix}"));
  assert.ok(s.tex.includes("f_{A,+}"));
  // Range spans from the opening $$ (line 1) to the closing $$ (line 6).
  assert.strictEqual(s.startLine, 1);
  assert.strictEqual(s.endLine, 6);
  assert.strictEqual(s.startCol, 0);
  assert.strictEqual(s.endCol, 2);
});

test("multi-line inline $...$ in docstring is one inline span", () => {
  const spans = scanLatexSpans(MULTILINE_INLINE);
  assert.strictEqual(spans.length, 1);
  const s = spans[0];
  assert.strictEqual(s.display, false);
  assert.strictEqual(s.startLine, 1);
  assert.strictEqual(s.endLine, 2);
  assert.ok(s.tex.startsWith("\\mu"));
  assert.ok(s.tex.endsWith("\\mu_\\mathrm{eff}"));
});

test("single-line $$...$$ in docstring still works", () => {
  const src = '"""\n$$E = \\frac{a}{b}$$\n"""';
  const spans = scanLatexSpans(src);
  assert.strictEqual(spans.length, 1);
  assert.strictEqual(spans[0].display, true);
  assert.strictEqual(spans[0].tex, "E = \\frac{a}{b}");
});

test("single-line $...$ in docstring still works", () => {
  const src = '"""\nThe Fock matrix is $F = h + J - K$ where.\n"""';
  assert.deepStrictEqual(texs(src), ["F = h + J - K"]);
});

test("# comment math still works", () => {
  const spans = scanLatexSpans("# but $E=mc^2$ here renders\nx = 1");
  assert.strictEqual(spans.length, 1);
  assert.strictEqual(spans[0].context, "comment");
  assert.strictEqual(spans[0].display, false);
});

test("unclosed single $ in a comment produces no span", () => {
  assert.deepStrictEqual(texs("# a line with $ no close\nx = 1"), []);
});

test("unclosed $$ at EOF produces no span", () => {
  assert.deepStrictEqual(texs('"""\n$$\nnever closed\n"""'), []);
});

test("$ inside an ordinary string is ignored", () => {
  assert.deepStrictEqual(
    texs('x = "a string with a # and a $ inside"  # $E=mc^2$ renders'),
    ["E=mc^2"]
  );
});

test("escaped \\$ in a comment is not a delimiter", () => {
  assert.deepStrictEqual(texs("# Escaped \\$5.00 is not math."), []);
});

test("single-line docstring with math", () => {
  assert.deepStrictEqual(texs('"""$E=mc^2$"""'), ["E=mc^2"]);
});

test("docstring then comment on the same line", () => {
  const spans = scanLatexSpans("'''doc'''  # $E=mc^2$\n");
  assert.strictEqual(spans.length, 1);
  assert.strictEqual(spans[0].context, "comment");
  assert.strictEqual(spans[0].startLine, 0);
  assert.strictEqual(spans[0].startCol, 13);
});

test("two spans on one comment line", () => {
  assert.deepStrictEqual(texs("# $a$ and $b$ here"), ["a", "b"]);
});

test("empty $$ $$ is skipped", () => {
  assert.deepStrictEqual(texs('"""\n$$$$\n"""'), []);
});

console.log(`\n${passed} tests passed`);
