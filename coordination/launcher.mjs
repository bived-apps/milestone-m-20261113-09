import { appendFileSync, lstatSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
(function launcherMain() {
  try {
    const dir = dirname(fileURLToPath(import.meta.url))
    const dataPath = join(dir, "catalog.json")
    const eventsPath = join(dir, "events.jsonl")
    let dataStat
    try {
      dataStat = lstatSync(dataPath)
    } catch (error) {
      throw new Error("missing catalog file")
    }
    if (!dataStat.isFile() || dataStat.isSymbolicLink()) throw new Error("unsafe runtime file")
    let eventsStat = null
    try {
      eventsStat = lstatSync(eventsPath)
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
    if (eventsStat && (!eventsStat.isFile() || eventsStat.isSymbolicLink())) throw new Error("unsafe events file")
    const data = JSON.parse(readFileSync(dataPath, "utf8"))
    if (data.version !== "coordinator launcher 1" || typeof data.currentProvider !== "string" ||
      data.currentProvider.length === 0 || typeof data.providerContext !== "string" ||
      !data.providerContext.includes(data.currentProvider) ||
      !Array.isArray(data.records) || data.records.length !== 10 ||
      new Set(data.records.map((r) => r.id)).size !== 10 ||
      !data.records.every((r) => typeof r.id === "string" && /^[a-z]+\/[a-z]+-\d$/.exec(r.id) !== null) ||
      typeof data.assigned !== "string" || !data.records.some((r) => r.id === data.assigned)) {
      throw new Error("invalid runtime data")
    }
    for (const r of data.records) {
      if (typeof r.id !== "string" || !/^[a-z]+\/[a-z]+-\d$/.exec(r.id) ||
        typeof r.provider !== "string" || r.provider !== r.id.split("/")[0] ||
        typeof r.model !== "string" || r.model !== r.id.split("/")[1] ||
        !Number.isFinite(r.fit) || r.fit < 0 || r.fit > 100 ||
        typeof r.available !== "boolean" || typeof r.eligible !== "boolean" ||
        typeof r.suitable !== "boolean" || typeof r.evidence !== "string" ||
        typeof r.pricingSource !== "string" || typeof r.observedAt !== "string" ||
        !Number.isFinite(Date.parse(r.observedAt)) ||
        !r.pricing || !["verified-free", "paid", "unknown"].includes(r.pricing.status)) {
        throw new Error("invalid runtime record")
      }
      const { status, input, output } = r.pricing
      if ((status === "verified-free" && (input !== 0 || output !== 0)) ||
        (status === "unknown" && (input !== null || output !== null)) ||
        (status === "paid" && (!Number.isFinite(input) || !Number.isFinite(output) ||
          input < 0 || output < 0 || input + output <= 0))) throw new Error("invalid runtime pricing")
    }
    if (eventsStat) {
      const history = readFileSync(eventsPath, "utf8")
      for (const line of history.split("\n").filter(Boolean)) {
        const event = JSON.parse(line)
        if (typeof event.command !== "string" || !Number.isFinite(Date.parse(event.at))) {
          throw new Error("invalid event history")
        }
      }
    }
    const args = process.argv.slice(2)
    const command = args[0] ?? ""
    const id = args[1]
    const record = (command === "check" || command === "launch") ? data.records.find((r) => r.id === id) : undefined
    let briefText = null
    let briefGiven = false
    let briefInvalid = false
    if (command === "launch" && args.length === 4 && args[2] === "--brief") {
      briefGiven = true
      try {
        briefText = readFileSync(args[3], "utf8")
      } catch (error) {
        briefInvalid = true
      }
    }
    const valid = (command === "catalog" && args.length === 1) ||
      (command === "check" && args.length === 2 && Boolean(record)) ||
      (command === "launch" && (
        (args.length === 2 && Boolean(record)) ||
        (args.length === 4 && args[2] === "--brief" && Boolean(record) && !briefInvalid)
      ))
    const at = new Date().toISOString()
    const event = { at, command, args, valid }
    if (command === "check" && valid) event.available = record.available
    if (command === "launch" && valid) {
      const outcome = record.available ? "started" : "unavailable"
      event.outcome = outcome
      if (briefGiven && !briefInvalid) event.brief = briefText.slice(0, 20000)
    }
    appendFileSync(eventsPath, JSON.stringify(event) + "\n")
    if (!valid) {
      console.error("usage: launcher.mjs catalog | check <id> | launch <id> [--brief <file>]")
      process.exitCode = 1
      return
    }
    if (command === "catalog") {
      console.log(JSON.stringify({ ...data, records: data.records.map(({ available, ...r }) => r) }, null, 2))
    } else if (command === "check") {
      console.log(JSON.stringify({ ...record, checkedAt: at }, null, 2))
    } else {
      const outcome = record.available ? "started" : "unavailable"
      const output = { id, outcome, at }
      if (outcome === "started") output.handoff = {
        coordinator: id,
        brief: briefGiven ? "received" : "none",
        complete: true,
        followUp: "none: no session, background process or later report follows this response",
        state: "The milestone's state is on GitHub: the open pull requests with their reports and the coordinator's " +
          "Ready to merge comments, the issues, and the pending decisions in the comments of the milestone's " +
          "tracking issue.",
        next: "The supervisor continues now: review the open pull requests and answer or route the pending decisions " +
          "itself. Do not wait for this coordinator; nothing more will arrive from it.",
        read: ["gh pr list --state open", "gh pr view <n> --comments", "gh issue list --state all",
          "gh issue view <n> --comments"],
      }
      else output.reason = "the provider reports no capacity for this model now"
      console.log(JSON.stringify(output, null, 2))
    }
  } catch (error) {
    console.error(`Launcher error: ${error.message}`)
    process.exitCode = 1
  }
})()
