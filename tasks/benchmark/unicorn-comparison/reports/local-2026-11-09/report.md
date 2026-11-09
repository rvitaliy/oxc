# unicorn/no-multiple-promise-resolver-calls CLI comparison

> Preliminary shared-host measurements: substantial concurrent CPU load and variable timings. These are not an isolated-runner baseline. Read the [measurement context](README.md) before interpreting the ratios.

Local controlled synthetic workloads; CLI end-to-end wall time includes process startup, parsing, semantic work and JSON reporting. The empty file is a startup-oriented baseline; larger inputs amortize startup. This does not measure an isolated rule or persistent JIT. Warmups can populate OS and ESLint CLI-managed V8 compile caches; each measurement starts a fresh process, and no lint-result cache is used.

- Recorded diagnostic column differences: 0; see results.json for individual cases. Unicode column units may differ and require review.
- Mode: measurement; preset: default; samples per tool: 20; warmups: 3.
- Parent PR: #29140; source commit: `9f9ea26781ccf223810e27e987ea1a62edb20bd3`.
- CPU: Apple M1 Max; available logical cores: 10; OS: darwin 27.2.0 (arm64).
- Node: 26.12.1; ESLint: 10.14.0; Unicorn: 79.0.0; Oxlint: Version: 1.93.0.

Times are milliseconds, median (Q1–Q3); ratio is ESLint median divided by Oxlint median. See results.json for raw samples, min/max, hashes, provenance and machine load.

| Scenario         | Files |    KiB | Diagnostics |           Oxlint ms |              ESLint ms | Ratio |
| ---------------- | ----: | -----: | ----------: | ------------------: | ---------------------: | ----: |
| empty            |     1 |   0.00 |           0 |   7.86 (6.05–10.02) | 581.00 (533.19–672.50) | 73.88 |
| small-mixed      |     1 |   1.39 |           4 |    7.04 (6.31–8.50) | 638.32 (535.99–706.91) | 90.67 |
| large-clean      |     8 | 415.64 |           0 | 10.51 (10.30–13.26) | 772.63 (756.65–821.06) | 73.49 |
| large-mixed      |     8 | 378.27 |        1024 | 16.79 (15.77–18.02) | 876.30 (863.42–894.25) | 52.19 |
| large-non-target |     8 | 404.39 |           0 | 11.98 (11.13–12.53) | 852.60 (837.42–871.97) | 71.18 |
