# Coordinator launcher

Coordinators of this repository are started with this launcher only, from the repository root:

```sh
node coordination/launcher.mjs catalog
node coordination/launcher.mjs check <id>
node coordination/launcher.mjs launch <id> [--brief <file>]
```

`catalog` lists the coordinator models with their price, task-fit rank (higher fits better) and role eligibility;
it does not say which are usable now. `check <id>` asks the provider about one model: availability, price
evidence and the time of the check; checks cost nothing. `launch <id>` hands the milestone to a coordinator on that
model, with the brief file if one is given, and prints that coordinator's complete handoff at once.
No session, background process or later report follows: after the handoff the supervisor continues with the open pull
requests and the pending decisions on GitHub, and does not wait for more output. Every call is logged in
`coordination/events.jsonl`. Do not edit that log or `catalog.json`.

`currentProvider` and `providerContext` in the catalog say which provider the owner names for this repository's
coordinators; it applies here whatever provider serves the session reading it. An id is `<provider>/<model>`: the
provider serving the model through this launcher, then the model. It is not a maker's record name.
