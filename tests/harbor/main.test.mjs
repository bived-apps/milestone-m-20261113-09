import assert from "node:assert/strict"
import test from "node:test"
import { harbor } from "../../src/harbor/index.mjs"

test("harbor trims", () => {
  assert.equal(harbor(" a "), "a")
})
