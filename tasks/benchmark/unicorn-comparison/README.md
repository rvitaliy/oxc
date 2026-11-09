# Unicorn rule CLI comparison

This isolated child workspace compares one native Oxlint rule with the same
`eslint-plugin-unicorn` rule. It measures **end-to-end process wall time**: CLI
startup, configuration, parsing, semantic work, rule execution and JSON
reporting are all included. The empty file is a startup-oriented baseline, not
an amount to subtract from other cases. The large corpus amortizes startup but
is not a persistent-JIT, warmed in-process, or isolated-rule measurement.

## Reproduce

Use the manifest's exact Rust, Node and pnpm versions in the benchmark branch:

```sh
cd tasks/benchmark/unicorn-comparison
pnpm install --frozen-lockfile --ignore-scripts
node prepare.mjs
node run.mjs --output results/preflight --preflight-only
node run.mjs --output results/smoke --smoke
node run.mjs --output reports/local-2026-11-09
```

Activate the pinned versions for every command, for example with
`mise exec rust@1.99.1 node@26.12.1 pnpm@12.7.0 -- <command>`.
`prepare.mjs` verifies that the PR commit is an ancestor and native inputs match
it, rejects untracked native sources, and builds using
`cargo build --locked -p oxlint --release --features allocator` with JSON
artifact reporting. It verifies the inputs again after compilation, copies the
Cargo-reported executable to ignored `.cache/oxlint`, and records build identity
in `.cache/build.json`. It inherits `CARGO_TARGET_DIR` and `CARGO_BUILD_JOBS`.
The runner requires metadata matching the manifest and binary hash. Overrides
`--binary PATH --build-metadata PATH` must identify a matching prepared pair.
Build metadata establishes which native inputs were present at build time; use
an isolated worktree and avoid concurrent edits. The Cargo artifact profile must
be optimized, with debug assertions and overflow checks disabled. Runtime and
compiler environment overrides are rejected; `CARGO_TARGET_DIR` and
`CARGO_BUILD_JOBS` remain supported. Global Cargo configuration and platform
conditions can still affect a build, so this describes the ordinary official
release profile rather than guaranteeing identical binaries everywhere. Never
commit the binary.

The default uses three untimed warmups and 20 samples per tool and case,
alternating execution order; `--samples N` (1–20) and `--warmups N` (0–20)
can override these. Each tool runs serially; Oxlint uses one thread. Warmups
can populate operating-system and ESLint CLI-managed V8 compile caches. Each
measurement starts a fresh process; no JIT process is retained. Choose a quiet machine, record competing activity, and repeat a full
run when variation or system load is material. The report gives medians,
quartiles, minimum/maximum and raw ordered samples; a ratio is the ratio of
medians, not a confidence interval or a guarantee on other workloads.

Each run uses a fresh temporary fixture directory. After measurement, the runner
rehashes fixtures, configuration, harness, metadata and binary and stops before
writing results if any changed.

The deterministic `spec.mjs` exports arrays `clean`, `invalid`, `nonTarget`.
Each entry has `{name, code, diagnostics}`; code is one complete source line,
and every expected diagnostic must be on that line. The generator encloses each
entry in a distinct function. Scenarios comprise an empty file, eight mixed entries,
and eight files of 256 clean, mixed or non-target entries. `--smoke` uses smaller
large scenarios and two samples; it is a functional check, not a published
benchmark. Generated fixtures live under ignored `.cache/fixtures`.

Before timing each scenario, both tools print their resolved config. The runner
requires exactly one enabled error-level rule, checks file and rule counts,
parsing errors, exit status and expected per-file/per-line diagnostic identity
and severity. It records column differences for review because diagnostic
spans can legitimately differ. JSON column units may differ for Unicode; review
recorded differences manually. It stops on mismatch; investigate equivalence
before reporting any ratio. Both timing commands format JSON and send stdout to
the null device, so formatter overhead remains included. No lint-result cache,
fix, suggestion or warning suppression is enabled. ESLint's default V8 compile
cache remains enabled; its cache environment overrides are rejected.

`results.json` records raw samples, order, checksums of each fixture and config,
versions, source and benchmark commit IDs, start/end times, normalized CLI arguments,
binary SHA-256 and machine characteristics without recording absolute paths,
hostnames or usernames. `report.md` is generated from those samples and can be regenerated with
`node report.mjs results/full/results.json results/full/report.md`. Both
outputs contain measured results only and must not be committed as universal
performance claims. The path passed to `--output` chooses their destination.
The child workspace has its own lockfile and must not modify the repository's
root dependency graph.
