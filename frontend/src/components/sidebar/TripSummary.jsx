import React from "react";
import Button from "../Button";
import TripTimeline from "./TripTimeline";
import { exportToGoogleMaps } from "../../utils/googleMapsExport";

class TripSummary extends React.Component {
  handleExportRoute = () => {
    exportToGoogleMaps(
      this.props.origin,
      this.props.destination,
      this.props.detourList
    );
  };

  render() {
    var showTripSummary = false;
    if (Object.entries(this.props.tripSummary).length !== 0) {
      showTripSummary = true;
    }

    return (
      <div>
        {showTripSummary ? (
          <div className="trip-summary">
            <div className="container">
              <div className="row">
                <div className="col-6">
                  <p className="distance-summary">
                    Distance: {this.props.tripSummary.distance} mi
                  </p>
                  <p className="time-summary">
                    Time: {this.props.tripSummary.time.hours} hr{" "}
                    {this.props.tripSummary.time.min} min
                  </p>
                </div>
                <div className="col-6">
                  <Button
                    disabledCriteria={!this.props.showDetourButton}
                    onClick={this.props.getDetourForm}
                    className="btn btn-primary add-detour-btn"
                    id="add-detour-button"
                    text="+ Add Detour"
                  ></Button>
                  <Button
                    disabledCriteria={
                      !this.props.origin || !this.props.destination
                    }
                    onClick={this.handleExportRoute}
                    className="btn export-route-btn mt-2"
                    id="export-route-button"
                    text="Open in Google Maps"
                  ></Button>
                </div>
              </div>
            </div>
            <TripTimeline
              origin={this.props.origin}
              destination={this.props.destination}
              detourList={this.props.detourList}
              removeDetour={this.props.removeDetour}
              setRoute={this.props.setRoute}
              setTripSummary={this.props.setTripSummary}
              setDetourList={this.props.setDetourList}
            ></TripTimeline>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  }
}

export default TripSummary;
