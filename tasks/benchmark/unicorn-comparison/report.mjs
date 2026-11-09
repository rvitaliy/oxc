import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function renderReport(report) {
  const rows = report.scenarios.map((s) => {
    const kib = (s.files.reduce((sum, file) => sum + file.bytes, 0) / 1024).toFixed(2);
    if (!s.statistics)
      return `| ${s.name} | ${s.files.length} | ${kib} | ${s.expectedDiagnostics} | — | — | — |`;
    const { oxlint, eslint } = s.statistics;
    return `| ${s.name} | ${s.files.length} | ${kib} | ${s.expectedDiagnostics} | ${oxlint.median.toFixed(2)} (${oxlint.q1.toFixed(2)}–${oxlint.q3.toFixed(2)}) | ${eslint.median.toFixed(2)} (${eslint.q1.toFixed(2)}–${eslint.q3.toFixed(2)}) | ${s.ratioOfMedians.toFixed(2)} |`;
  });
  const notice =
    report.mode === "measurement"
      ? ""
      : "\n**FUNCTIONAL CHECK ONLY:** this preflight or smoke run is not a benchmark result.\n";
  const machine = report.machine;
  return `# ${report.manifest.rule} CLI comparison\n\n${notice}\nLocal controlled synthetic workloads; CLI end-to-end wall time includes process startup, parsing, semantic work and JSON reporting. The empty file is a startup-oriented baseline; larger inputs amortize startup. This does not measure an isolated rule or persistent JIT.\n\n- Mode: ${report.mode}; preset: ${report.preset}; samples per tool: ${report.samples}; warmups: ${report.warmups}.\n- Parent PR: #${report.manifest.parentPR}; source commit: \`${report.manifest.parentCommit}\`.\n- CPU: ${machine.cpu}; available logical cores: ${machine.logicalCores}; OS: ${machine.platform} ${machine.release} (${machine.architecture}).\n- Node: ${report.versions.node}; ESLint: ${report.versions.eslint}; Unicorn: ${report.versions.unicorn}; Oxlint: ${report.versions.oxlint}.\n\nTimes are milliseconds, median (Q1–Q3); ratio is ESLint median divided by Oxlint median. See results.json for raw samples, min/max, hashes, provenance and machine load.\n\n| Scenario | Files | KiB | Diagnostics | Oxlint ms | ESLint ms | Ratio |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows.join("\n")}\n`;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2] || !process.argv[3])
    throw Error("Usage: node report.mjs results.json report.md");
  writeFileSync(process.argv[3], renderReport(JSON.parse(readFileSync(process.argv[2], "utf8"))));
}
