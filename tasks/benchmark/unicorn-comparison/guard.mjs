// Reject overrides that would make compiler or runtime settings unrecorded.
export function checkEnvironment() {
  for (const [name, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (
      [
        "NODE_OPTIONS",
        "NODE_V8_COVERAGE",
        "RUSTFLAGS",
        "CARGO_ENCODED_RUSTFLAGS",
        "CARGO_BUILD_RUSTFLAGS",
      ].includes(name)
      || name.startsWith("CARGO_PROFILE_RELEASE_")
      || /^CARGO_TARGET_.*_RUSTFLAGS$/.test(name)
    ) {
      throw Error(`Unsupported environment override: ${name}`);
    }
  }
}
export function validReleaseProfile(profile) {
  return (
    profile?.opt_level === "3"
    && profile.debug_assertions === false
    && profile.overflow_checks === false
    && profile.test === false
  );
}
