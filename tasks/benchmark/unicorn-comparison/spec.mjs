// Dedicated cases; the runner wraps each entry in a separate function.
export const clean = [
  {
    name: "promise-valid-exclusive",
    code: 'function benchPromiseValidExclusive(flag, value) { return new Promise((resolve, reject) => { if (flag) { resolve(value); } else { reject(new Error("unavailable")); } }); }',
    diagnostics: 0,
  },
  {
    name: "promise-valid-early-return",
    code: 'function benchPromiseValidEarlyReturn(flag) { return new Promise(resolve => { if (flag) { resolve("cached"); return; } resolve("fresh"); }); }',
    diagnostics: 0,
  },
  {
    name: "promise-valid-callback",
    code: "function benchPromiseValidCallback(run) { return new Promise((resolve, reject) => { run((error, value) => { if (error) { return reject(error); } resolve(value); }); }); }",
    diagnostics: 0,
  },
  {
    name: "promise-valid-argument-catch",
    code: "function benchPromiseValidArgumentCatch(read) { return new Promise((resolve, reject) => { try { resolve(read()); } catch (error) { reject(error); } }); }",
    diagnostics: 0,
  },
  {
    name: "promise-valid-catch-finally",
    code: "function benchPromiseValidCatchFinally(read, cleanup) { return new Promise((resolve, reject) => { let value; try { value = read(); } catch (error) { return reject(error); } finally { cleanup(); } resolve(value); }); }",
    diagnostics: 0,
  },
  {
    name: "promise-valid-loop-break",
    code: "function benchPromiseValidLoopBreak(values) { return new Promise(resolve => { for (const item of values) { if (item.ready) { resolve(item); break; } } }); }",
    diagnostics: 0,
  },
  {
    name: "promise-valid-switch",
    code: 'function benchPromiseValidSwitch(kind) { return new Promise((resolve, reject) => { switch (kind) { case "ready": resolve(1); break; case "error": reject(new Error(kind)); break; default: resolve(null); } }); }',
    diagnostics: 0,
  },
  {
    name: "promise-valid-guard",
    code: 'function benchPromiseValidGuard(enabled, value) { return new Promise((resolve, reject) => { if (enabled && value) { return resolve(value); } return reject(new Error("disabled")); }); }',
    diagnostics: 0,
  },
];
export const invalid = [
  {
    name: "promise-invalid-repeat",
    code: "function benchPromiseInvalidRepeat(value) { return new Promise(resolve => { resolve(value); resolve(value + 1); }); }",
    diagnostics: 1,
  },
  {
    name: "promise-invalid-resolve-reject",
    code: 'function benchPromiseInvalidResolveReject(value) { return new Promise((resolve, reject) => { resolve(value); reject(new Error("late failure")); }); }',
    diagnostics: 1,
  },
  {
    name: "promise-invalid-missing-return",
    code: "function benchPromiseInvalidMissingReturn(error, value) { return new Promise((resolve, reject) => { if (error) { reject(error); } resolve(value); }); }",
    diagnostics: 1,
  },
  {
    name: "promise-invalid-default",
    code: "function benchPromiseInvalidDefault() { return new Promise((resolve, reject, value = resolve(0)) => { resolve(value); }); }",
    diagnostics: 1,
  },
  {
    name: "promise-invalid-nested-argument",
    code: "function benchPromiseInvalidNestedArgument(error) { return new Promise((resolve, reject) => { resolve(reject(error)); }); }",
    diagnostics: 1,
  },
  {
    name: "promise-invalid-update-key",
    code: 'function benchPromiseInvalidUpdateKey(object) { return new Promise(resolve => { object[resolve("key")]++; resolve("done"); }); }',
    diagnostics: 1,
  },
  {
    name: "promise-invalid-catch-finally",
    code: 'function benchPromiseInvalidCatchFinally(read) { return new Promise((resolve, reject) => { try { read(); } catch (error) { reject(error); } finally { resolve("fallback"); } }); }',
    diagnostics: 1,
  },
  {
    name: "promise-invalid-loop",
    code: "function benchPromiseInvalidLoop() { return new Promise(resolve => { for (let index = 0; index < 3; index++) { resolve(index); } }); }",
    diagnostics: 1,
  },
];
export const nonTarget = [
  {
    name: "promise-nontarget-array-pipeline",
    code: "function benchPromiseNonTargetArrayPipeline(values) { return values.filter(value => value.active).map(value => ({ id: value.id, label: String(value.label).trim() })); }",
    diagnostics: 0,
  },
  {
    name: "promise-nontarget-object-copy",
    code: 'function benchPromiseNonTargetObjectCopy(input, updates) { const { id, name = "anonymous", ...rest } = input; return { ...rest, ...updates, id, name: name.toUpperCase() }; }',
    diagnostics: 0,
  },
  {
    name: "promise-nontarget-string-cleanup",
    code: 'function benchPromiseNonTargetStringCleanup(text) { return text.split(",").map(part => part.trim()).filter(Boolean).join(" | "); }',
    diagnostics: 0,
  },
  {
    name: "promise-nontarget-histogram",
    code: "function benchPromiseNonTargetHistogram(values) { const counts = {}; for (const value of values) { counts[value] = (counts[value] ?? 0) + 1; } return counts; }",
    diagnostics: 0,
  },
  {
    name: "promise-nontarget-index",
    code: "function benchPromiseNonTargetIndex(items) { const byId = new Map(); for (const item of items) { byId.set(item.id, item); } return Array.from(byId.values()); }",
    diagnostics: 0,
  },
  {
    name: "promise-nontarget-format",
    code: 'function benchPromiseNonTargetFormat(user) { const display = user.displayName ?? user.name; return `${display}: ${user.roles.slice().sort().join("/")}`; }',
    diagnostics: 0,
  },
  {
    name: "promise-nontarget-merge",
    code: "function benchPromiseNonTargetMerge(base, incoming) { return Object.entries(incoming).reduce((result, [key, value]) => { if (value !== undefined) { result[key] = value; } return result; }, { ...base }); }",
    diagnostics: 0,
  },
  {
    name: "promise-nontarget-parse-record",
    code: "function benchPromiseNonTargetParseRecord(source) { try { const record = JSON.parse(source); return { ok: true, value: record.value ?? null }; } catch (error) { return { ok: false, message: String(error) }; } }",
    diagnostics: 0,
  },
];
