# fix: allow www frontend API requests

This PR added explicit support for credentialed API requests from both `https://jauntdetour.com` and `https://www.jauntdetour.com`. It fixes route creation when visitors enter through the `www` hostname while preserving `https://jauntdetour.com` as the login and logout destination.

## Changes

- Added a comma-delimited `CORS_ALLOWED_ORIGINS` configuration with exact origin matching, whitespace trimming, credential support, and a backward-compatible `FRONTEND_URL` fallback.
- Added focused backend tests covering both trusted origins, preflight requests, unknown origins, requests without an `Origin` header, and fallback behavior.
- Updated the backend deployment job to configure both production origins in Azure.
- Added a standalone production smoke script that checks API readiness, expected unauthenticated responses, CORS headers, credentials, and rejection of an untrusted origin.
- Updated environment examples and project documentation to distinguish CORS access from authentication redirect configuration.

## Testing

- `cd backend && npm test -- --runInBand` (155 tests passed)
- `cd backend && npm run lint`
- `cd backend && npx jest app/middleware/corsConfig.test.js --runInBand` (6 tests passed)
- `bash -n .github/scripts/verify-production-cors.sh`
- Workflow Prettier, patch whitespace, and editor diagnostics passed.

## Related Issues

None

## Notes

- Production behavior will change only after this branch is merged and the backend deployment completes.
- The post-deployment smoke check expects unauthenticated `/auth/me` requests to return `401`.
- Manual verification through the `www` hostname and Instagram profile link remains pending production deployment.
