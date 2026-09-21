import test from "node:test";
import assert from "node:assert/strict";
import {
  exampleFormula,
  exampleHerb,
  createHerbalVideoProps,
} from "../src/herbal-data.ts";

test("example herb keeps the educational title and classical profile", () => {
  assert.equal(exampleHerb.name, "山药");
  assert.equal(exampleHerb.category, "补益药");
  assert.match(exampleHerb.classicalLine, /补脾养胃/);
});

test("example formula exposes four editable ingredients", () => {
  assert.equal(exampleFormula.name, "四君子汤");
  assert.equal(exampleFormula.ingredients.length, 4);
  assert.deepEqual(
    exampleFormula.ingredients.map((ingredient) => ingredient.name),
    ["人参", "白术", "茯苓", "炙甘草"],
  );
});

test("template props allow title and accent overrides without losing defaults", () => {
  const props = createHerbalVideoProps({ title: "陈皮", accent: "#9c3b27" });

  assert.equal(props.title, "陈皮");
  assert.equal(props.accent, "#9c3b27");
  assert.equal(props.category, "补益药");
  assert.equal(props.formula.name, "四君子汤");
});
