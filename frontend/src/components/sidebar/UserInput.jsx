import React from "react";
import PropTypes from "prop-types";
import RouteRequester from "../../scripts/RouteRequester.js";
import Button from "../Button";
import log from "../../utils/logger";

class UserInput extends React.Component {
  constructor() {
    super();

    this.requestRoute = this.requestRoute.bind(this);
  }

  requestRoute(e) {
    e.preventDefault();
    log.debug("Requesting route");
    var origin = e.target[0].value;
    var destination = e.target[1].value;
    this.props.setOrigin(origin);
    this.props.setDestination(destination);
    var routeRequester = new RouteRequester();
    routeRequester
      .getRoute(origin, destination, "Address", {})
      .then((data) => {
        if (data.routes.length > 0) {
          this.props.setRoute(data.routes[0]);
          log.debug("Route summary:", data.routes[0].summary);
          this.props.setTripSummary(data.routes[0].summary);
        }
      })
      .catch(function (error) {
        log.error("Error requesting route:", error);
      });
  }

  render() {
    var classes = this.props.classes + " user-input container";

    var formInputClass = "";
    var formButtonClass = "";
    if (this.props.type === "desktop") {
      formInputClass = "form-control-lg route-input";
      formButtonClass = "btn form-control-lg route-submit";
    } else {
      formInputClass = "form-control-sm route-input";
      formButtonClass = "btn form-control-sm route-submit";
    }

    return (
      <div className={classes}>
        <form onSubmit={this.requestRoute}>
          <div className="form-group origin-input">
            <input
              className={formInputClass}
              type="text"
              placeholder="Origin"
            />
          </div>
          <div className="form-group destination-input">
            <input
              className={formInputClass}
              type="text"
              placeholder="Destination"
            />
          </div>
          <div className="row">
            <div className="col"></div>
            <div className="col-4 clear-btn-container">
              <Button
                onClick={this.props.clearAll}
                className="btn btn-danger btn-clear"
                type="button"
                id="user-input-clear"
                text="Clear"
              ></Button>
            </div>
            <div className="form-group col-4 submit-btn-container">
              <input className={formButtonClass} type="submit" value="Go" />
            </div>
          </div>
        </form>
      </div>
    );
  }
}

UserInput.propTypes = {
  type: PropTypes.string,
  classes: PropTypes.string,
  setOrigin: PropTypes.func,
  setDestination: PropTypes.func,
  setRoute: PropTypes.func,
  setTripSummary: PropTypes.func,
  clearAll: PropTypes.func,
};

export default UserInput;
