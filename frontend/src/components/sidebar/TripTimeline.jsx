import React from 'react';
import TimelineItem from "./TimelineItem";

class TripTimeline extends React.Component {

    render() {

        /**
         * Map all of the detours to timeline items
         */
        var detourList = this.props.detourList.map(function(detour, index)
            {
              // Created muted subtext
              var mutedText = "Rating: " + detour.rating;

              return (
                <TimelineItem
                badgeClass="timeline-badge hike"
                title={detour.name}
                mutedText={mutedText} 
                type="detour"
                detourIndex = {index}
                removeDetour = {this.props.removeDetour}
                setRoute = {this.props.setRoute}
                detourList = {this.props.detourList}
                origin = {this.props.origin}
                destination = {this.props.destination}>   
                </TimelineItem>
              )
            }, this);

        return (
            <div className="container">
                <ul className="timeline">
                    <TimelineItem
                    badgeClass="timeline-badge"
                    title={this.props.origin}
                    type="origin">   
                    </TimelineItem>
                    {detourList}
                    <TimelineItem
                    badgeClass="timeline-badge"
                    title={this.props.destination}
                    type="destination">   
                    </TimelineItem>
                </ul>
            </div>
        )
    }
}

export default TripTimeline;