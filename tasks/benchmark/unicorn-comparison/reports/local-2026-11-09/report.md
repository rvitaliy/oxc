# unicorn/no-invalid-intl-options CLI comparison

> Preliminary shared-host measurements: substantial concurrent CPU load and variable timings. These are not an isolated-runner baseline. Read the [measurement context](README.md) before interpreting the ratios.

Local controlled synthetic workloads; CLI end-to-end wall time includes process startup, parsing, semantic work and JSON reporting. The empty file is a startup-oriented baseline; larger inputs amortize startup. This does not measure an isolated rule or persistent JIT. Warmups can populate OS and ESLint CLI-managed V8 compile caches; each measurement starts a fresh process, and no lint-result cache is used.

- Recorded diagnostic column differences: 103; see results.json for individual cases. Unicode column units may differ and require review.
- Mode: measurement; preset: default; samples per tool: 20; warmups: 3.
- Parent PR: #29139; source commit: `951d9bbe98f98accc308039dab2e76836ee78c9b`.
- CPU: Apple M1 Max; available logical cores: 10; OS: darwin 27.2.0 (arm64).
- Node: 26.12.1; ESLint: 10.14.0; Unicorn: 79.0.0; Oxlint: Version: 1.93.0.

Times are milliseconds, median (Q1–Q3); ratio is ESLint median divided by Oxlint median. See results.json for raw samples, min/max, hashes, provenance and machine load.

| Scenario         | Files |    KiB | Diagnostics |           Oxlint ms |              ESLint ms | Ratio |
| ---------------- | ----: | -----: | ----------: | ------------------: | ---------------------: | ----: |
| empty            |     1 |   0.00 |           0 |    4.83 (4.65–5.12) | 429.03 (421.07–440.71) | 88.89 |
| small-mixed      |     1 |   0.86 |           4 |    5.20 (4.86–6.56) | 438.54 (411.25–485.20) | 84.30 |
| large-clean      |     8 | 255.72 |           0 |   9.18 (8.23–11.60) | 651.68 (639.58–671.95) | 70.99 |
| large-mixed      |     8 | 224.17 |        1024 | 11.14 (10.80–13.07) | 695.16 (644.71–785.38) | 62.41 |
| large-non-target |     8 | 328.39 |           0 |   9.80 (9.25–10.63) | 893.25 (839.22–958.98) | 91.19 |
