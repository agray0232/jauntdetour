import React from "react";
import Button from "../Button";
import RouteRequester from "../../scripts/RouteRequester.js";
import { getDetourIconComponent } from "../../utils/detourIcons.js";

class TimelineItem extends React.Component {
  constructor() {
    super();

    this.removeDetour = this.removeDetour.bind(this);
    this.moveUp = this.moveUp.bind(this);
    this.moveDown = this.moveDown.bind(this);
  }

  removeDetour() {
    var detourIndex = this.props.detourIndex;

    if (detourIndex >= 0) {
      var newDetourList = this.props.detourList.filter(function (
        detour,
        index
      ) {
        return index !== detourIndex;
      });

      var waypointList = [];

      newDetourList.forEach((detour) => {
        waypointList.push(detour.placeId);
      });

      var routeRequester = new RouteRequester();
      routeRequester
        .getRoute(this.props.origin, this.props.destination, "Address", {
          waypoints: waypointList,
        })
        .then((data) => {
          if (data.routes.length > 0) {
            this.props.setRoute(data.routes[0]);
            this.props.setTripSummary(data.routes[0].summary);
          }
        })
        .catch(function (error) {
          console.log("Error: " + error);
        });

      this.props.removeDetour(this.props.detourIndex);
    }
  }

  moveUp() {
    // Get the detour's index
    var index = this.props.detourIndex;

    // Only move up if the index is set and this isn't the first item
    if (index > 0) {
      var newIndex = index - 1;
      var newDetourList = [];
      this.arrayMove(this.props.detourList, index, newIndex);
      this.props.detourList.forEach((detour) => {
        newDetourList.push(detour);
      });

      var waypointList = [];

      newDetourList.forEach((detour) => {
        detour.addedTime = -1;
        waypointList.push(detour.placeId);
      });

      var routeRequester = new RouteRequester();
      routeRequester
        .getRoute(this.props.origin, this.props.destination, "Address", {
          waypoints: waypointList,
        })
        .then((data) => {
          if (data.routes.length > 0) {
            this.props.setRoute(data.routes[0]);
            this.props.setTripSummary(data.routes[0].summary);
          }
        })
        .catch(function (error) {
          console.log("Error: " + error);
        });

      this.props.setDetourList(newDetourList);
    }
  }

  moveDown() {
    // Get the detour's index
    var index = this.props.detourIndex;

    // Only move down if the index is set and this isn't the last item
    if (index !== this.props.detourList.length - 1) {
      var newIndex = index + 1;
      var newDetourList = [];
      this.arrayMove(this.props.detourList, index, newIndex);
      this.props.detourList.forEach((detour) => {
        newDetourList.push(detour);
      });

      var waypointList = [];

      newDetourList.forEach((detour) => {
        detour.addedTime = -1;
        waypointList.push(detour.placeId);
      });

      var routeRequester = new RouteRequester();
      routeRequester
        .getRoute(this.props.origin, this.props.destination, "Address", {
          waypoints: waypointList,
        })
        .then((data) => {
          if (data.routes.length > 0) {
            this.props.setRoute(data.routes[0]);
            this.props.setTripSummary(data.routes[0].summary);
          }
        })
        .catch(function (error) {
          console.log("Error: " + error);
        });

      this.props.setDetourList(newDetourList);
    }
  }

  arrayMove(arr, old_index, new_index) {
    if (new_index >= arr.length) {
      var k = new_index - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  }

  render() {
    var showDetourOptions = true;
    var badgeIcon = getDetourIconComponent(this.props.type);

    // Special handling for origin and destination
    if (this.props.type === "origin" || this.props.type === "destination") {
      showDetourOptions = false;
    }

    return (
      <li className="timeline-inverted">
        <div className={this.props.badgeClass}>{badgeIcon}</div>
        <div className="timeline-panel">
          <div className="timeline-heading">
            <h5 className="timeline-title">{this.props.title}</h5>
          </div>
          <div className="timeline-body">
            {showDetourOptions ? (
              <p>
                <small className="text-muted">{this.props.mutedText}</small>
              </p>
            ) : (
              <div></div>
            )}
            {showDetourOptions ? (
              <p>
                <small className="text-muted">{this.props.addedTimeTxt}</small>
              </p>
            ) : (
              <div></div>
            )}
            {showDetourOptions ? (
              <div>
                <hr />
                <div className="container detour-edit-options">
                  <div className="row">
                    <div className="col detour-edit-remove">
                      <Button
                        onClick={this.removeDetour}
                        className="btn-default btn btn-remove-detour"
                        type="button"
                        id="user-input-clear"
                        text="Remove"
                      ></Button>
                    </div>
                    <div className="col-4 detour-edit-move">
                      <button
                        className="btn detour-arrow-btn"
                        onClick={this.moveUp}
                      >
                        <i className="fa fa-angle-up"></i>
                      </button>
                      <button
                        className="btn detour-arrow-btn"
                        onClick={this.moveDown}
                      >
                        <i className="fa fa-angle-down"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </li>
    );
  }
}

export default TimelineItem;
