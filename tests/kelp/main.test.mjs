import assert from "node:assert/strict"
import test from "node:test"
import { kelp } from "../../src/kelp/index.mjs"

test("kelp trims", () => {
  assert.equal(kelp(" a "), "a")
})
