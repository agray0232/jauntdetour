import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import AuthRequester from "../scripts/AuthRequester";
import { consumeAuthReturnPath, getCurrentAppPath } from "./authReturnPath";

const AuthSessionContext = createContext(null);

export function AuthSessionProvider({ children }) {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const requesterRef = useRef(new AuthRequester());
  const navigateRef = useRef(navigate);
  const initialPathRef = useRef(
    `${location.pathname}${location.search}${location.hash}`
  );
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    requesterRef.current
      .getCurrentUser()
      .then((currentUser) => {
        if (!active) {
          return;
        }

        if (currentUser) {
          dispatch({ type: "SET_USER", data: { user: currentUser } });
          setStatus("signedIn");

          const returnPath = consumeAuthReturnPath();
          const currentPath = initialPathRef.current;
          if (returnPath && returnPath !== currentPath) {
            navigateRef.current(returnPath, { replace: true });
          }
        } else {
          dispatch({ type: "CLEAR_USER" });
          setStatus("signedOut");
        }
      })
      .catch(() => {
        // getCurrentUser() resolves to null on error today, but guard against a
        // rejected promise so status never gets stuck on "checking" (which would
        // leave protected routes spinning forever).
        if (!active) {
          return;
        }
        dispatch({ type: "CLEAR_USER" });
        setStatus("signedOut");
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  const signIn = useCallback((returnPath = getCurrentAppPath()) => {
    requesterRef.current.login(returnPath);
  }, []);

  const signOut = useCallback(() => {
    dispatch({ type: "CLEAR_USER" });
    setStatus("signedOut");
    return requesterRef.current.logout();
  }, [dispatch]);

  const value = useMemo(
    () => ({ user, status, signIn, signOut }),
    [signIn, signOut, status, user]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

AuthSessionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}
