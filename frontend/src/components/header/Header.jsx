import React from "react";
import PropTypes from "prop-types";
import UserInput from "../sidebar/UserInput";

class Header extends React.Component {
  render() {
    return (
      <div className="header">
        <UserInput
          type="mobile"
          classes="user-input-mobile"
          origin={this.props.origin}
          destination={this.props.destination}
          setOrigin={this.props.setOrigin}
          setDestination={this.props.setDestination}
          setRoute={this.props.setRoute}
          setTripSummary={this.props.setTripSummary}
          clearAll={this.props.clearAll}
        ></UserInput>
      </div>
    );
  }
}

Header.propTypes = {
  origin: PropTypes.object,
  destination: PropTypes.object,
  setOrigin: PropTypes.func,
  setDestination: PropTypes.func,
  setRoute: PropTypes.func,
  setTripSummary: PropTypes.func,
  clearAll: PropTypes.func,
};

export default Header;
