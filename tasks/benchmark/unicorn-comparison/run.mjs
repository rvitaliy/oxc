import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { openSync, closeSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clean, invalid, nonTarget } from "./spec.mjs";
import manifest from "./benchmark.json" with { type: "json" };
import { renderReport } from "./report.mjs";
import { checkEnvironment, validReleaseProfile } from "./guard.mjs";

checkEnvironment();

const root = path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const args = process.argv.slice(2);
function option(name, fallback) {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  if (!args[i + 1] || args[i + 1].startsWith("--")) throw Error(`Missing value for ${name}`);
  return args[i + 1];
}
const binary = option("--binary", process.env.OXLINT_BINARY ?? ".cache/oxlint");
const buildMetadataPath = option("--build-metadata", ".cache/build.json");
const startedAt = new Date().toISOString();
const output = option("--output", "results");
const preflightOnly = args.includes("--preflight-only");
const smoke = args.includes("--smoke");
const samples = Number(option("--samples", smoke ? "2" : "20"));
const warmups = Number(option("--warmups", smoke ? "1" : "3"));
if (
  !Number.isInteger(samples)
  || samples < 1
  || samples > 20
  || !Number.isInteger(warmups)
  || warmups < 0
  || warmups > 20
)
  throw Error("Samples must be 1–20 and warmups 0–20");
if (process.versions.node !== manifest.node)
  throw Error(`Node ${manifest.node} required, got ${process.versions.node}`);
const sha = (data) => createHash("sha256").update(data).digest("hex");
const fileHash = (file) => sha(readFileSync(file));
const oxlint = path.resolve(binary);
const eslint = path.join(root, "node_modules/eslint/bin/eslint.js");
const baseOx = [
  "--config",
  path.join(root, "oxlint.json"),
  "--threads",
  "1",
  "--no-ignore",
  "--disable-nested-config",
  "-A",
  "all",
  "-D",
  manifest.rule,
];
const baseEs = [
  eslint,
  "--no-config-lookup",
  "--config",
  path.join(root, "eslint.config.mjs"),
  "--no-ignore",
];
function run(executable, command, allowFailure = false) {
  const result = spawnSync(executable, command, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.error || (!allowFailure && result.status !== 0))
    throw Error(`Command failed: ${result.error ?? result.stderr}`);
  return result;
}
function version(command, argv) {
  const r = run(command, argv);
  return r.stdout.trim();
}
const eslintVersion = JSON.parse(
  readFileSync(path.join(root, "node_modules/eslint/package.json")),
).version;
const unicornVersion = JSON.parse(
  readFileSync(path.join(root, "node_modules/eslint-plugin-unicorn/package.json")),
).version;
if (eslintVersion !== manifest.eslint || unicornVersion !== manifest.unicorn)
  throw Error("Installed dependency versions do not match manifest");
const pnpmVersion = version("pnpm", ["--version"]);
if (pnpmVersion !== manifest.pnpm) throw Error(`pnpm ${manifest.pnpm} required`);
const fixtureRoot = path.join(root, ".cache/fixtures");
mkdirSync(fixtureRoot, { recursive: true });
const runFixtureRoot = mkdtempSync(path.join(fixtureRoot, "run-"));
const generatedFixtures = [];
const scenarios = [
  { name: "empty", files: 1, blocks: 0, kind: "clean" },
  { name: "small-mixed", files: 1, blocks: 8, kind: "mixed" },
  { name: "large-clean", files: smoke ? 2 : 8, blocks: smoke ? 8 : 256, kind: "clean" },
  { name: "large-mixed", files: smoke ? 2 : 8, blocks: smoke ? 8 : 256, kind: "mixed" },
  { name: "large-non-target", files: smoke ? 2 : 8, blocks: smoke ? 8 : 256, kind: "nonTarget" },
];
for (const pool of [clean, invalid, nonTarget]) {
  if (
    !pool.length
    || pool.some(
      (x) =>
        typeof x.name !== "string"
        || typeof x.code !== "string"
        || /[\r\n]/.test(x.code)
        || !Number.isInteger(x.diagnostics)
        || x.diagnostics < 0,
    )
  )
    throw Error("Invalid spec entry");
}
function generate(scenario) {
  const dir = path.join(runFixtureRoot, scenario.name);
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (let file = 0; file < scenario.files; file++) {
    const name = `fixture-${file}.js`;
    const lines = [];
    const expected = [];
    for (let i = 0; i < scenario.blocks; i++) {
      const pool =
        scenario.kind === "nonTarget"
          ? nonTarget
          : scenario.kind === "mixed" && i % 2
            ? invalid
            : clean;
      const entry =
        pool[(Math.floor(i / (scenario.kind === "mixed" ? 2 : 1)) + file) % pool.length];
      lines.push(`function benchmarkCase${i}() { ${entry.code} }`);
      for (let n = 0; n < entry.diagnostics; n++) expected.push(i + 1);
    }
    const content = lines.length ? `${lines.join("\n")}\n` : "";
    const fullPath = path.join(dir, name);
    writeFileSync(fullPath, content);
    files.push({
      path: fullPath,
      name,
      bytes: Buffer.byteLength(content),
      sha256: sha(content),
      expected,
    });
  }
  return files;
}
function severity(value) {
  return Array.isArray(value)
    ? severity(value[0])
    : value === 2 || value === "error" || value === "deny"
      ? 2
      : value === 1 || value === "warn"
        ? 1
        : 0;
}
function assertConfig(config, label) {
  if (!config.rules || typeof config.rules !== "object")
    throw Error(`${label} print-config has no rules`);
  const enabled = Object.entries(config.rules).filter(([, value]) => severity(value) > 0);
  if (enabled.length !== 1 || enabled[0][0] !== manifest.rule || severity(enabled[0][1]) !== 2)
    throw Error(`${label} expected only ${manifest.rule} at error: ${JSON.stringify(enabled)}`);
}
function normalizeOx(result, files) {
  const output = JSON.parse(result.stdout);
  if (output.number_of_files !== files.length || output.number_of_rules !== 1)
    throw Error("Oxlint file/rule count mismatch");
  return output.diagnostics.map((d) => {
    if (
      d.code !== `unicorn(${manifest.rule.split("/")[1]})`
      || d.severity !== "error"
      || !d.labels?.[0]?.span?.line
    )
      throw Error(`Unexpected Oxlint diagnostic: ${JSON.stringify(d)}`);
    return {
      file: path.basename(d.filename),
      line: d.labels[0].span.line,
      rule: manifest.rule,
      severity: 2,
      column: d.labels[0].span.column,
    };
  });
}
function normalizeEs(result, files) {
  const output = JSON.parse(result.stdout);
  if (output.length !== files.length || output.some((f) => f.fatalErrorCount || f.warningCount))
    throw Error("ESLint file count, parser, or warning mismatch");
  return output.flatMap((f) =>
    f.messages.map((d) => {
      if (d.fatal || d.ruleId !== manifest.rule || d.severity !== 2)
        throw Error(`Unexpected ESLint diagnostic: ${JSON.stringify(d)}`);
      return {
        file: path.basename(f.filePath),
        line: d.line,
        rule: d.ruleId,
        severity: d.severity,
        column: d.column,
      };
    }),
  );
}
const key = (d) => `${d.file}:${d.line}:${d.rule}:${d.severity}`;
const configs = [
  path.join(root, "benchmark.json"),
  path.join(root, "oxlint.json"),
  path.join(root, "eslint.config.mjs"),
  path.join(root, "spec.mjs"),
  path.join(root, "pnpm-lock.yaml"),
  path.join(root, "package.json"),
  path.join(root, "pnpm-workspace.yaml"),
  path.join(root, "run.mjs"),
  path.join(root, "report.mjs"),
  path.join(root, "prepare.mjs"),
  path.join(root, "guard.mjs"),
];
const rustVersion = version("rustc", ["--version"]);
if (!rustVersion.startsWith(`rustc ${manifest.rust} `))
  throw Error(`Rust ${manifest.rust} required`);
const metadataSha256 = fileHash(buildMetadataPath);
const build = JSON.parse(readFileSync(buildMetadataPath, "utf8"));
const binarySha256 = fileHash(oxlint);
if (
  build.sourcePRsha !== manifest.parentCommit
  || build.binarySha256 !== binarySha256
  || build.nativeDiffEmpty !== true
  || build.node !== manifest.node
  || build.pnpm !== manifest.pnpm
  || !validReleaseProfile(build.artifactProfile)
  || !build.rust?.startsWith(`rustc ${manifest.rust} `)
)
  throw Error("Build metadata does not match manifest, toolchain or binary");
const benchmarkHead = version("git", ["rev-parse", "HEAD"]);
function normalizedArg(arg) {
  if (!path.isAbsolute(arg)) return arg;
  const relative = path.relative(root, arg);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative
    : "<external-binary>";
}
const expectedBuildArgv = [
  "cargo",
  "build",
  "--locked",
  "-p",
  "oxlint",
  "--release",
  "--features",
  "allocator",
  "--message-format=json-render-diagnostics",
];
if (
  JSON.stringify(build.buildArgv) !== JSON.stringify(expectedBuildArgv)
  || !/^[0-9a-f]{40}$/.test(build.benchmarkHead)
)
  throw Error("Invalid build metadata");
const buildRecord = {
  sourcePRsha: build.sourcePRsha,
  benchmarkHead: build.benchmarkHead,
  buildArgv: build.buildArgv,
  node: build.node,
  pnpm: build.pnpm,
  rust: build.rust,
  cargo: build.cargo,
  binarySha256: build.binarySha256,
  nativeDiffEmpty: build.nativeDiffEmpty,
  artifactProfile: build.artifactProfile,
};
const report = {
  manifest,
  mode: preflightOnly ? "preflight" : smoke ? "smoke" : "measurement",
  cachePolicy: {
    eslintDefaultV8CompileCache: "enabled by ESLint CLI",
    lintResultCache: false,
    processReuse: false,
  },
  startedAt,
  benchmarkHead,
  build: buildRecord,
  binarySha256,
  versions: {
    node: process.versions.node,
    pnpm: pnpmVersion,
    eslint: eslintVersion,
    unicorn: unicornVersion,
    oxlint: version(oxlint, ["--version"]),
    rust: rustVersion,
  },
  machine: {
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    cpu: os.cpus()[0]?.model,
    logicalCores: os.availableParallelism(),
    memoryBytes: os.totalmem(),
    loadAverage: os.loadavg(),
  },
  configurationSha256: Object.fromEntries(configs.map((p) => [path.basename(p), fileHash(p)])),
  preset: smoke ? "smoke" : "default",
  samples,
  warmups,
  scenarios: [],
};
const nullFd = openSync(os.devNull, "w");
try {
  for (const scenario of scenarios) {
    const files = generate(scenario);
    const paths = files.map((f) => f.path);
    generatedFixtures.push(...files.map((f) => ({ path: f.path, sha256: f.sha256 })));
    const expected = files
      .flatMap((f) =>
        f.expected.map((line) => key({ file: f.name, line, rule: manifest.rule, severity: 2 })),
      )
      .sort();
    assertConfig(JSON.parse(run(oxlint, [...baseOx, "--print-config"]).stdout), "Oxlint");
    assertConfig(
      JSON.parse(run(process.execPath, [...baseEs, "--print-config", paths[0]]).stdout),
      "ESLint",
    );
    const oxArgs = [...baseOx, "--format", "json", ...paths];
    const esArgs = [...baseEs, "--format", "json", ...paths];
    const oxResult = run(oxlint, oxArgs, true);
    const esResult = run(process.execPath, esArgs, true);
    const expectedExit = expected.length ? 1 : 0;
    if (
      oxResult.error
      || esResult.error
      || oxResult.status !== expectedExit
      || esResult.status !== expectedExit
    )
      throw Error(`Unexpected CLI status ${scenario.name}: ${oxResult.status}/${esResult.status}`);
    const ox = normalizeOx(oxResult, files);
    const es = normalizeEs(esResult, files);
    if (
      JSON.stringify(ox.map(key).sort()) !== JSON.stringify(expected)
      || JSON.stringify(es.map(key).sort()) !== JSON.stringify(expected)
    )
      throw Error(`Diagnostic mismatch in ${scenario.name}`);
    const esColumns = new Map(es.map((d) => [key(d), d.column]));
    const columnDifferences = ox
      .filter((d) => esColumns.get(key(d)) !== d.column)
      .map((d) => ({
        file: d.file,
        line: d.line,
        oxlint: d.column,
        eslint: esColumns.get(key(d)),
      }));
    const result = {
      name: scenario.name,
      files: files.map(({ name, bytes, sha256, expected }) => ({
        name,
        bytes,
        sha256,
        expectedDiagnostics: expected.length,
      })),
      expectedDiagnostics: expected.length,
      columnDifferences,
      argv: {
        oxlint: [normalizedArg(oxlint), ...oxArgs.map(normalizedArg)],
        eslint: ["node", ...esArgs.map(normalizedArg)],
      },
      rawMilliseconds: { oxlint: [], eslint: [] },
      executionOrder: [],
    };
    const invoke = (tool) => {
      const start = process.hrtime.bigint();
      const r = spawnSync(
        tool === "oxlint" ? oxlint : process.execPath,
        tool === "oxlint" ? oxArgs : esArgs,
        { cwd: root, stdio: ["ignore", nullFd, "pipe"] },
      );
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
      if (r.error || r.status !== expectedExit)
        throw Error(`${tool} failed during timing: ${r.error ?? r.stderr.toString()}`);
      return elapsed;
    };
    if (!preflightOnly) {
      for (let i = 0; i < warmups + samples; i++) {
        const order = i % 2 ? ["eslint", "oxlint"] : ["oxlint", "eslint"];
        for (const tool of order) {
          const ms = invoke(tool);
          result.executionOrder.push({
            tool,
            phase: i < warmups ? "warmup" : "sample",
            milliseconds: ms,
          });
          if (i >= warmups) result.rawMilliseconds[tool].push(ms);
        }
      }
    }
    report.scenarios.push(result);
    console.log(
      `${scenario.name}: ${files.length} files, ${expected.length} diagnostics, ${columnDifferences.length} column differences`,
    );
  }
} finally {
  closeSync(nullFd);
}
function quantile(sorted, q) {
  const x = (sorted.length - 1) * q;
  const i = Math.floor(x);
  return sorted[i] + (sorted[Math.ceil(x)] - sorted[i]) * (x - i);
}
function stats(values) {
  const a = [...values].sort((a, b) => a - b);
  return {
    min: a[0],
    q1: quantile(a, 0.25),
    median: quantile(a, 0.5),
    q3: quantile(a, 0.75),
    max: a.at(-1),
  };
}
for (const s of report.scenarios)
  if (!preflightOnly) {
    s.statistics = {
      oxlint: stats(s.rawMilliseconds.oxlint),
      eslint: stats(s.rawMilliseconds.eslint),
    };
    s.ratioOfMedians = s.statistics.eslint.median / s.statistics.oxlint.median;
  }
for (const fixture of generatedFixtures) {
  if (fileHash(fixture.path) !== fixture.sha256) throw Error("Fixture changed during the run");
}
for (const config of configs) {
  if (fileHash(config) !== report.configurationSha256[path.basename(config)])
    throw Error("Configuration or harness changed during the run");
}
if (fileHash(buildMetadataPath) !== metadataSha256 || fileHash(oxlint) !== binarySha256)
  throw Error("Build metadata or binary changed during the run");
report.finishedAt = new Date().toISOString();
report.machine.loadAverageAfter = os.loadavg();
mkdirSync(output, { recursive: true });
writeFileSync(path.join(output, "results.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(path.join(output, "report.md"), renderReport(report));
