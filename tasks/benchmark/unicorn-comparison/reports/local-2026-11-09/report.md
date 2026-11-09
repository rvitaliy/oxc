# unicorn/no-invalid-response-options CLI comparison

> Preliminary shared-host measurements: substantial concurrent CPU load and variable timings. These are not an isolated-runner baseline. Read the [measurement context](README.md) before interpreting the ratios.

Local controlled synthetic workloads; CLI end-to-end wall time includes process startup, parsing, semantic work and JSON reporting. The empty file is a startup-oriented baseline; larger inputs amortize startup. This does not measure an isolated rule or persistent JIT. Warmups can populate OS and ESLint CLI-managed V8 compile caches; each measurement starts a fresh process, and no lint-result cache is used.

- Recorded diagnostic column differences: 0; see results.json for individual cases. Unicode column units may differ and require review.
- Mode: measurement; preset: default; samples per tool: 20; warmups: 3.
- Parent PR: #29138; source commit: `49953cdc5ff212c07937fe302775ba3373aca140`.
- CPU: Apple M1 Max; available logical cores: 10; OS: darwin 27.2.0 (arm64).
- Node: 26.12.1; ESLint: 10.14.0; Unicorn: 79.0.0; Oxlint: Version: 1.93.0.

Times are milliseconds, median (Q1–Q3); ratio is ESLint median divided by Oxlint median. See results.json for raw samples, min/max, hashes, provenance and machine load.

| Scenario         | Files |    KiB | Diagnostics |        Oxlint ms |              ESLint ms | Ratio |
| ---------------- | ----: | -----: | ----------: | ---------------: | ---------------------: | ----: |
| empty            |     1 |   0.00 |           0 | 5.30 (5.07–9.65) | 485.19 (476.03–531.76) | 91.56 |
| small-mixed      |     1 |   0.51 |           4 | 5.22 (4.85–6.17) | 485.64 (472.16–768.35) | 92.99 |
| large-clean      |     8 | 138.39 |           0 | 6.74 (6.46–7.30) | 580.27 (556.75–597.25) | 86.07 |
| large-mixed      |     8 | 137.64 |        1024 | 8.20 (7.98–8.38) | 531.17 (521.11–538.36) | 64.81 |
| large-non-target |     8 | 155.14 |           0 | 6.79 (6.39–8.95) | 570.80 (562.11–574.87) | 84.11 |
