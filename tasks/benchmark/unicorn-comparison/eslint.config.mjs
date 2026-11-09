import unicorn from "eslint-plugin-unicorn";
import manifest from "./benchmark.json" with { type: "json" };

export default [{ files: ["**/*.js"], plugins: { unicorn }, rules: { [manifest.rule]: "error" } }];
