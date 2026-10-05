import test from "node:test";
import assert from "node:assert/strict";
import { createHerbalVideoProps } from "../src/herbal-data.ts";

// Only the override path is asserted. The two tests that used to sit here pinned the
// literal contents of `exampleHerb` and `exampleFormula` — 山药 / 补益药 / 四君子汤 — which
// are the Studio's default props, not a rule anything depends on. The behaviour worth
// keeping is that an override lands without dropping the defaults underneath it.
test("template props allow title and accent overrides without losing defaults", () => {
  const props = createHerbalVideoProps({ title: "陈皮", accent: "#9c3b27" });

  assert.equal(props.title, "陈皮");
  assert.equal(props.accent, "#9c3b27");
  assert.equal(props.category, "补益药");
  assert.equal(props.formula.name, "四君子汤");
});
