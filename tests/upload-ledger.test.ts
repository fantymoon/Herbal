import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isFrozen } from "../scripts/lib/frozen-films.ts";
import { readFilmId } from "../scripts/lib/film-files.ts";

const finishedDir = new URL("../src/finished/", import.meta.url);
const uploadDir = new URL("../upload/", import.meta.url);

// Fields every upload ledger must declare. Values may stay empty while a film is
// still in production (copy is written after the final visual checks), but the
// skeleton has to be there — the previous 55 films were published with no ledger
// at all, which left nothing to cite when the platform pushed back.
const REQUIRED_LEDGER_FIELDS = ["film:", "标题：", "描述：", "话题：", "BGM：", "抖音：", "视频号："];

const newFilms = fs
  .readdirSync(finishedDir)
  .filter((f) => f.endsWith(".tsx") && !isFrozen(f))
  .sort();

test("every new film ships with an upload ledger naming that film", () => {
  for (const file of newFilms) {
    const kebab = file.replace(/\.tsx$/, "");
    const ledger = new URL(`${kebab}.md`, uploadDir);
    assert.equal(fs.existsSync(ledger), true, `upload/${kebab}.md is missing`);
    const copy = fs.readFileSync(ledger, "utf8");
    for (const field of REQUIRED_LEDGER_FIELDS) {
      assert.equal(copy.includes(field), true, `upload/${kebab}.md is missing "${field}"`);
    }
    const filmId = readFilmId(fs.readFileSync(new URL(file, finishedDir), "utf8"));
    assert.ok(filmId, `${file} declares no exported film component`);
    assert.equal(
      copy.includes(filmId),
      true,
      `upload/${kebab}.md does not name the film id ${filmId}`,
    );
  }
});

test("the upload ledger skeleton is in place for the next film", () => {
  // 黄芝 is the first film under the current rules; its ledger is written ahead of
  // the film itself, so this asserts the template is usable rather than empty.
  const next = new URL("huangzhi-first-film.md", uploadDir);
  assert.equal(fs.existsSync(next), true, "upload/huangzhi-first-film.md is missing");
  const copy = fs.readFileSync(next, "utf8");
  for (const field of REQUIRED_LEDGER_FIELDS) {
    assert.equal(copy.includes(field), true, `upload/huangzhi-first-film.md is missing "${field}"`);
  }
});
