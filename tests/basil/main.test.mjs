import assert from "node:assert/strict"
import test from "node:test"
import { basil } from "../../src/basil/index.mjs"

test("basil trims", () => {
  assert.equal(basil(" a "), "a")
})
