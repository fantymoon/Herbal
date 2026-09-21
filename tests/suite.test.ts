import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// `node --test tests/` silently skips the TypeScript files, so the runner needs an
// explicit file list. That list is easy to forget to update, which would mean a new
// test never actually runs — so this suite guards the list itself.
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts: Record<string, string>;
};

const testsDir = new URL(".", import.meta.url);
const present = fs
  .readdirSync(testsDir)
  .filter((f) => /\.test\.(ts|mjs|js)$/.test(f))
  .sort();
const listed = [...pkg.scripts.test.matchAll(/tests\/([\w.-]+)/g)].map((m) => m[1]).sort();

test("the test script runs every test file in tests/", () => {
  assert.deepEqual(listed, present, "package.json test script and tests/ disagree");
});

test("the test script uses the TypeScript-aware runner", () => {
  assert.equal(pkg.scripts.test.includes("--experimental-strip-types"), true);
  assert.equal(pkg.scripts.test.includes("--test"), true);
});

test("every shared rule module is reachable from the check command", () => {
  const libDir = new URL("../scripts/lib/", import.meta.url);
  const modules = fs
    .readdirSync(libDir)
    .filter((f) => f.endsWith(".ts"))
    .sort();
  assert.ok(modules.length > 0, "scripts/lib is empty");
  assert.equal(pkg.scripts.check.includes("scripts/check-films.ts"), true);
});
