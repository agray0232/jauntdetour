import React from 'react';
import TimelineItem from "./TimelineItem";

class TripTimeline extends React.Component {

    render() {

        var detourList = this.props.detourList.map(detour =>
            {
                var mutedText = "Rating: " + detour.rating;

              return (
                <TimelineItem
                badgeClass="timeline-badge hike"
                title={detour.name}
                mutedText={mutedText} >   
                </TimelineItem>
              )
            });

        return (
            <div class="container">
                <ul class="timeline">
                    <TimelineItem
                    badgeClass="timeline-badge"
                    title={this.props.origin}>   
                    </TimelineItem>
                    {detourList}
                    <TimelineItem
                    badgeClass="timeline-badge"
                    title={this.props.destination}>   
                    </TimelineItem>
                </ul>
            </div>
        )
    }
}

export default TripTimeline;