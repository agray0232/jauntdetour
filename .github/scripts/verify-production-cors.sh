#!/usr/bin/env bash
#
# verify-production-cors.sh
# Verify credentialed CORS behavior for the deployed Jaunt API.

set -euo pipefail

readonly API_BASE_URL="${API_BASE_URL:-https://api.jauntdetour.com}"
readonly UNTRUSTED_ORIGIN="https://example.com"

err() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

assert_unauthenticated_response() {
  local status="$1"
  local origin="$2"

  if [[ "${status}" != "401" ]]; then
    err "Expected /auth/me to return 401 for ${origin}, received ${status}"
  fi
}

assert_header() {
  local headers_file="$1"
  local expected_header="$2"

  if ! tr -d '\r' < "${headers_file}" \
    | grep --ignore-case --fixed-strings --line-regexp --quiet \
      "${expected_header}"; then
    err "Expected response header: ${expected_header}"
  fi
}

verify_origin() {
  local origin="$1"
  local headers_file
  local status
  headers_file="$(mktemp)"

  if ! status="$(curl --silent --show-error \
    --dump-header "${headers_file}" \
    --output /dev/null \
    --write-out '%{http_code}' \
    --header "Origin: ${origin}" \
    "${API_BASE_URL}/auth/me")"; then
    rm -f "${headers_file}"
    err "Failed to request /auth/me from ${origin}"
  fi

  assert_unauthenticated_response "${status}" "${origin}"
  assert_header "${headers_file}" "access-control-allow-origin: ${origin}"
  assert_header "${headers_file}" "access-control-allow-credentials: true"
  rm -f "${headers_file}"
}

verify_untrusted_origin() {
  local headers_file
  local status
  headers_file="$(mktemp)"

  if ! status="$(curl --silent --show-error \
    --dump-header "${headers_file}" \
    --output /dev/null \
    --write-out '%{http_code}' \
    --header "Origin: ${UNTRUSTED_ORIGIN}" \
    "${API_BASE_URL}/auth/me")"; then
    rm -f "${headers_file}"
    err "Failed to perform the untrusted-origin check"
  fi

  assert_unauthenticated_response "${status}" "${UNTRUSTED_ORIGIN}"
  if tr -d '\r' < "${headers_file}" \
    | grep --ignore-case --quiet '^access-control-allow-origin:'; then
    rm -f "${headers_file}"
    err "Unexpectedly allowed untrusted origin ${UNTRUSTED_ORIGIN}"
  fi
  rm -f "${headers_file}"
}

main() {
  local -a trusted_origins

  if [[ -z "${CORS_ALLOWED_ORIGINS:-}" ]]; then
    err "CORS_ALLOWED_ORIGINS must contain at least one origin"
  fi

  curl --silent --show-error --fail \
    --retry 12 --retry-all-errors --retry-delay 5 \
    "${API_BASE_URL}/test" > /dev/null

  IFS=',' read -r -a trusted_origins <<< "${CORS_ALLOWED_ORIGINS}"
  for origin in "${trusted_origins[@]}"; do
    verify_origin "${origin}"
  done

  verify_untrusted_origin
}

main "$@"