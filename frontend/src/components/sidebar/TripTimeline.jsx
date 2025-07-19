import React from "react";
import TimelineItem from "./TimelineItem";

class TripTimeline extends React.Component {
  createAddedTimeText(detour) {
    var addedTimeTxt = "";

    if (detour.addedTime !== -1) {
      var addedHours = Math.floor(detour.addedTime / 60);
      var addedMin = detour.addedTime - addedHours * 60;
      var addedHoursTxt = "";
      var addedMinTxt = "";
      if (addedHours > 0) {
        addedHoursTxt = addedHours + " hr";
      }
      if (addedMin > 0) {
        addedMinTxt = addedMin + " min";
      }
      if (addedMin > 0 && addedHours > 0) {
        addedTimeTxt = "+ " + addedHoursTxt + " " + addedMinTxt;
      } else {
        addedTimeTxt = "+ " + addedHoursTxt + addedMinTxt;
      }
    } else {
      addedTimeTxt = "Time added not calculated";
    }

    return addedTimeTxt;
  }

  render() {
    /**
     * Map all of the detours to timeline items
     */
    var detourList = this.props.detourList.map(function (detour, index) {
      // Created muted subtext
      var mutedText = "Rating: " + detour.rating;

      // Create added time text
      var addedTimeTxt = this.createAddedTimeText(detour);

      //var badgeClass = "timeline-badge";
      var detourType = "";
      switch (detour.type) {
        case "Hike":
          detourType = "hike";
          break;
        case "Coffee":
          detourType = "coffee";
          break;
        case "Museum":
          detourType = "museum";
          break;
        case "Landmark":
          detourType = "landmark";
          break;
        case "Restaurant":
          detourType = "restaurant";
          break;
        case "Bar":
          detourType = "bar";
          break;
        case "Gas Station":
          detourType = "gas-station";
          break;
        case "Charging Station":
          detourType = "charging-station";
          break;
        default:
          detourType = "detour";
      }

      var badgeClass = "timeline-badge " + detourType;

      return (
        <TimelineItem
          title={detour.name}
          mutedText={mutedText}
          addedTimeTxt={addedTimeTxt}
          type={detourType}
          badgeClass={badgeClass}
          detourIndex={index}
          removeDetour={this.props.removeDetour}
          setRoute={this.props.setRoute}
          setTripSummary={this.props.setTripSummary}
          setDetourList={this.props.setDetourList}
          detourList={this.props.detourList}
          origin={this.props.origin}
          destination={this.props.destination}
        ></TimelineItem>
      );
    }, this);

    return (
      <div className="container">
        <ul className="timeline">
          <TimelineItem
            title={this.props.origin}
            type="origin"
            badgeClass="timeline-badge origin"
          ></TimelineItem>
          {detourList}
          <TimelineItem
            title={this.props.destination}
            type="destination"
            badgeClass="timeline-badge destination"
          ></TimelineItem>
        </ul>
      </div>
    );
  }
}

export default TripTimeline;
