import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "./benchmark.json" with { type: "json" };
import { checkEnvironment, validReleaseProfile } from "./guard.mjs";

checkEnvironment();

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "../../..");
const nativePaths = [
  "Cargo.toml",
  "Cargo.lock",
  "rust-toolchain",
  "rust-toolchain.toml",
  ".cargo",
  "crates",
  "apps",
  "napi",
];
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    ...options,
  });
  if (result.error || result.status !== 0)
    throw Error(`${command} failed: ${result.error ?? result.stderr}`);
  return result.stdout;
}
if (process.versions.node !== manifest.node) throw Error(`Node ${manifest.node} required`);
const pnpm = run("pnpm", ["--version"]).trim();
if (pnpm !== manifest.pnpm) throw Error(`pnpm ${manifest.pnpm} required`);
const rust = run("rustc", ["--version"]).trim();
if (!rust.startsWith(`rustc ${manifest.rust} `)) throw Error(`Rust ${manifest.rust} required`);
run("git", ["merge-base", "--is-ancestor", manifest.parentCommit, "HEAD"]);
const head = run("git", ["rev-parse", "HEAD"]).trim();
const parent = run("git", ["rev-parse", `${manifest.parentCommit}^{commit}`]).trim();
if (parent !== manifest.parentCommit) throw Error("Manifest parent must be a full commit SHA");
const diff = run("git", ["diff", "--name-only", parent, "--", ...nativePaths]).trim();
function untrackedNative() {
  const ordinary = run("git", ["ls-files", "--others", "--exclude-standard", "--", ...nativePaths]);
  // Ignored Rust sources can still affect Cargo; exclude only dependency/build trees.
  const ignored = run("git", [
    "ls-files",
    "--others",
    "--ignored",
    "--exclude-standard",
    "--",
    ":(glob)crates/**/*.rs",
    ":(glob)apps/**/*.rs",
    ":(glob)napi/**/*.rs",
    ":(glob)crates/**/Cargo.toml",
    ":(glob)apps/**/Cargo.toml",
    ":(glob)napi/**/Cargo.toml",
    ":(exclude,glob)**/node_modules/**",
    ":(exclude,glob)**/target/**",
  ]);
  return ordinary.trim() || ignored.trim();
}
const untracked = untrackedNative();
if (diff || untracked)
  throw Error("Native inputs differ from the PR parent or contain untracked files; build stopped");
const cargoArgs = [
  "build",
  "--locked",
  "-p",
  "oxlint",
  "--release",
  "--features",
  "allocator",
  "--message-format=json-render-diagnostics",
];
const cargoOutput = run("cargo", cargoArgs);
let executable;
let profile;
for (const line of cargoOutput.split("\n")) {
  if (!line) continue;
  let item;
  try {
    item = JSON.parse(line);
  } catch {
    continue;
  }
  if (
    item.reason === "compiler-artifact"
    && item.target?.name === "oxlint"
    && item.target.kind?.includes("bin")
    && item.executable
  ) {
    executable = item.executable;
    profile = item.profile;
  }
}
if (!executable) throw Error("Cargo did not report an oxlint binary artifact");
if (!validReleaseProfile(profile))
  throw Error("Cargo artifact is not the expected optimized release profile");
// Recheck after build so a concurrent native edit cannot silently enter the record.
if (
  run("git", ["rev-parse", "HEAD"]).trim() !== head
  || run("git", ["diff", "--name-only", parent, "--", ...nativePaths]).trim()
  || untrackedNative()
)
  throw Error("Native inputs or HEAD changed during build");
const cache = path.join(root, ".cache");
mkdirSync(cache, { recursive: true });
const output = path.join(cache, "oxlint");
copyFileSync(executable, output);
const sha256 = createHash("sha256").update(readFileSync(output)).digest("hex");
const metadata = {
  sourcePRsha: parent,
  benchmarkHead: head,
  buildArgv: ["cargo", ...cargoArgs],
  node: process.versions.node,
  pnpm,
  rust,
  cargo: run("cargo", ["--version"]).trim(),
  binarySha256: sha256,
  nativeDiffEmpty: true,
  artifactProfile: profile,
};
writeFileSync(path.join(cache, "build.json"), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Built and recorded oxlint ${sha256}`);
