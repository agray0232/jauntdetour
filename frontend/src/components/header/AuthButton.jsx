import React from "react";
import PropTypes from "prop-types";
import AuthRequester from "../../scripts/AuthRequester";

/**
 * AuthButton — sign-in / sign-out control.
 *
 * On mount it asks the backend who the current user is (via the session cookie)
 * and stores the result in Redux. When signed out it shows "Sign in"; when
 * signed in it shows the display name and "Sign out".
 */
class AuthButton extends React.Component {
  constructor(props) {
    super(props);
    this.auth = new AuthRequester();
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidMount() {
    // Resolve login state from the backend session on first render, syncing
    // Redux to the backend's truth: set the user when signed in, clear it
    // otherwise (getCurrentUser resolves to null on a 401 or any error).
    this.auth.getCurrentUser().then((user) => {
      if (user) {
        this.props.setUser(user);
      } else {
        this.props.clearUser();
      }
    });
  }

  handleLogin() {
    this.auth.login();
  }

  handleLogout() {
    this.props.clearUser();
    this.auth.logout();
  }

  render() {
    const user = this.props.user;

    if (user) {
      const name = user.display_name || user.email;
      return (
        <div className="auth-button auth-button--signed-in">
          <span className="auth-button__name">{name}</span>
          <button type="button" onClick={this.handleLogout}>
            Sign out
          </button>
        </div>
      );
    }

    return (
      <div className="auth-button auth-button--signed-out">
        <button type="button" onClick={this.handleLogin}>
          Sign in
        </button>
      </div>
    );
  }
}

AuthButton.propTypes = {
  user: PropTypes.object,
  setUser: PropTypes.func.isRequired,
  clearUser: PropTypes.func.isRequired,
};

export default AuthButton;
