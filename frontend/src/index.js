import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { createStore } from "redux";
import mainReducer from "./reducers/main-reducer";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";

// Persist the planning state to sessionStorage so an in-progress trip survives
// full-page navigations — most importantly the sign-in redirect (backend →
// Entra → back), which would otherwise wipe the in-memory Redux state. Scoped
// to sessionStorage so it's per-tab and cleared when the tab closes. `user` is
// deliberately not persisted: auth state is always re-resolved from /auth/me.
const PERSIST_KEY = "jaunt.tripState";

function loadState() {
  try {
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
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
