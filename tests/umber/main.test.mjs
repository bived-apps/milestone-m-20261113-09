import assert from "node:assert/strict"
import test from "node:test"
import { umber } from "../../src/umber/index.mjs"

test("umber trims", () => {
  assert.equal(umber(" a "), "a")
})
