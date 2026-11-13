import assert from "node:assert/strict"
import test from "node:test"
import { lumen } from "../../src/lumen/index.mjs"

test("lumen trims", () => {
  assert.equal(lumen(" a "), "a")
})
