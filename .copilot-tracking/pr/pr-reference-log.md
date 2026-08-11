## PR Reference Analysis

### Summary

The hotfix allowed credentialed API requests from both public Jaunt frontend origins while preserving the existing authentication redirect destination.

### Changes by Significance

#### CORS behavior

- Added an explicit comma-delimited CORS allowlist with whitespace trimming and a `FRONTEND_URL` fallback.
- Kept credential support enabled and omitted allow-origin headers for untrusted origins.
- Added focused coverage for both public origins, preflight, untrusted origins, requests without an Origin header, and fallback behavior.

#### Deployment verification

- Configured `CORS_ALLOWED_ORIGINS` on the Azure backend during deployment.
- Added a standalone production smoke script that verifies API readiness, exact allow-origin headers, credentials, expected unauthenticated responses, and untrusted-origin rejection.
- Invoked the tracked script through Bash so workflow execution does not depend on executable file mode.

#### Configuration documentation

- Documented the separate responsibilities of `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` in environment examples, the README, and repository instructions.

### Issue References

None

### Verification Notes

- Backend tests passed: 10 suites and 155 tests.
- Focused CORS tests passed: 6 tests.
- Backend ESLint, workflow Prettier, Bash syntax, patch whitespace, and editor diagnostics passed.
- Live production verification remains pending deployment.
