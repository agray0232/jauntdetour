import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { createStore } from "redux";
import mainReducer from "./reducers/main-reducer";
import { FluentProvider } from "@fluentui/react-components";
import { BrowserRouter } from "react-router-dom";
import { AuthSessionProvider } from "./auth/AuthSessionProvider";
import { jauntDetourTheme } from "./design-system/jauntDetourTheme";

// Persist the planning state to sessionStorage so an in-progress trip survives
// full-page navigations — most importantly the sign-in redirect (backend →
// Entra → back), which would otherwise wipe the in-memory Redux state. Scoped
// to sessionStorage so it's per-tab and cleared when the tab closes. `user` is
// deliberately not persisted: auth state is always re-resolved from /auth/me.
const PERSIST_KEY = "jaunt.tripState";
// Set by AuthRequester.logout after a successful sign-out. When present on
// load, we discard the previous user's persisted planning state instead of
// rehydrating it — deferring the clear to here means nothing is visibly erased
// before the Entra logout redirect, and the app returns to a clean, empty
// state. See the "Planned trip persists after logout" fix.
const LOGOUT_FLAG = "jaunt.pendingLogout";

function loadState() {
  try {
    if (sessionStorage.getItem(LOGOUT_FLAG)) {
      // Returning from a sign-out: drop every app-owned key (all namespaced
      // under "jaunt.", including the flag itself) so nothing lingers for a
      // signed-out visitor on a shared browser, and start from empty state.
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("jaunt.")) {
          sessionStorage.removeItem(key);
        }
      }
      return undefined;
    }
    const saved = sessionStorage.getItem(PERSIST_KEY);
    return saved ? JSON.parse(saved) : undefined;
  } catch {
    return undefined;
  }
}

function saveState(state) {
  try {
    // eslint-disable-next-line no-unused-vars
    const { user, ...planning } = state;
    sessionStorage.setItem(PERSIST_KEY, JSON.stringify(planning));
  } catch {
    // Ignore write failures (e.g. storage disabled or full).
  }
}

let store = createStore(mainReducer, loadState());
store.subscribe(() => saveState(store.getState()));

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <FluentProvider theme={jauntDetourTheme}>
      <BrowserRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthSessionProvider>
          <App />
        </AuthSessionProvider>
      </BrowserRouter>
    </FluentProvider>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
