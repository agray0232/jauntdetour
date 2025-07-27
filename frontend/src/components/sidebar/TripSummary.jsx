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
                <div className="col">
                  <p className="distance-summary">
                    Distance: {this.props.tripSummary.distance} mi
                  </p>
                  <p className="time-summary">
                    Time: {this.props.tripSummary.time.hours} hr{" "}
                    {this.props.tripSummary.time.min} min
                  </p>
                </div>
                <div className="col-5">
                  <Button
                    disabledCriteria={!this.props.showDetourButton}
                    onClick={this.props.getDetourForm}
                    className="btn btn-primary add-detour-btn"
                    id="add-detour-button"
                    text="+ Add Detour"
                  ></Button>
                </div>
              </div>
              {/* Export Route Button Row */}
              <div className="row mt-2">
                <div className="col">
                  <Button
                    disabledCriteria={
                      !this.props.origin || !this.props.destination
                    }
                    onClick={this.handleExportRoute}
                    className="btn btn-outline-primary export-route-btn"
                    id="export-route-button"
                    text="Export to Google Maps"
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
