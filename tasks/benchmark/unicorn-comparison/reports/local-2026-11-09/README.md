# Preliminary local measurement

These are actual measurements from a shared Apple M1 Max workstation, not a calibrated isolated-runner baseline. All Cargo builds for this task had completed before measurement and all three comparisons ran serially. Other host activity remained significant: the recorded one-minute load average was 15.86 at the start and 11.50 at the end on 10 available logical cores. A post-run spot check showed about 98% CPU busy; CPU usage was not sampled continuously during the runs.

Interpret the ratios as preliminary CLI wall-time observations for these dedicated synthetic inputs. They do not establish an isolated rule's speed or a universal speedup. The quartiles and raw min/max show the observed variability; no samples were discarded. A quiet or dedicated runner is needed for a stable baseline.

- [Generated numerical report](report.md)
- [Raw samples and provenance](results.json)
- [Harness and reproduction instructions](../../README.md)

The run used the same files for both tools, only the selected error-level rule, release Oxlint with the allocator feature, ESLint's default V8 compile cache, 20 timed samples and three cache warmups per scenario/tool. Each CLI invocation was a fresh process. Every scenario passed the diagnostic/configuration preflight and final input-hash checks.

The numerical table is generated from the raw JSON. The shared-host notice was added after reviewing the recorded load and dispersion.
