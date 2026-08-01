export const AUTH_RETURN_PATH_KEY = "jaunt.authReturnPath";

export function getSafeReturnPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getCurrentAppPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function rememberAuthReturnPath(value = getCurrentAppPath()) {
  const returnPath = getSafeReturnPath(value);
  if (!returnPath) {
    return null;
  }

  try {
    sessionStorage.setItem(AUTH_RETURN_PATH_KEY, returnPath);
  } catch {
    return null;
  }
  return returnPath;
}

export function consumeAuthReturnPath() {
  try {
    const returnPath = getSafeReturnPath(
      sessionStorage.getItem(AUTH_RETURN_PATH_KEY)
    );
    sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
    return returnPath;
  } catch {
    return null;
  }
}
