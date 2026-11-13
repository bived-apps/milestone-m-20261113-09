import assert from "node:assert/strict"
import test from "node:test"
import { indigo } from "../../src/indigo/index.mjs"

test("indigo trims", () => {
  assert.equal(indigo(" a "), "a")
})
