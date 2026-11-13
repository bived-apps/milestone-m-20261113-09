import assert from "node:assert/strict"
import test from "node:test"
import { maple } from "../../src/maple/index.mjs"

test("maple trims", () => {
  assert.equal(maple(" a "), "a")
})
