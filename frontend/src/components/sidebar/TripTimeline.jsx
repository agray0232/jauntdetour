import React from 'react';
import TimelineItem from "./TimelineItem";

class TripTimeline extends React.Component {

    createAddedTimeText(detour){
        var addedTimeTxt = "";

        if(detour.addedTime !== -1){
            
            var addedHours = Math.floor(detour.addedTime / 60);
            var addedMin = detour.addedTime - (addedHours * 60);
            var addedHoursTxt = "";
            var addedMinTxt = "";
            if(addedHours > 0){
                addedHoursTxt = addedHours + " hr";
            }
            if(addedMin > 0){
                addedMinTxt = addedMin + " min";
            }
            if(addedMin > 0 && addedHours > 0){
                addedTimeTxt = "+ " + addedHoursTxt + " " + addedMinTxt;
            }
            else{
                addedTimeTxt = "+ " + addedHoursTxt + addedMinTxt;
            }
        }else{
            addedTimeTxt = "Not calculated - route altered"
        }


        return addedTimeTxt;
    }

    render() {

        /**
         * Map all of the detours to timeline items
         */
        var detourList = this.props.detourList.map(function(detour, index)
            {
              // Created muted subtext
              var mutedText = "Rating: " + detour.rating;

              // Create added time text
              var addedTimeTxt = this.createAddedTimeText(detour);

              return (
                <TimelineItem
                badgeClass="timeline-badge hike"
                title={detour.name}
                mutedText={mutedText} 
                addedTimeTxt={addedTimeTxt}
                type="detour"
                detourIndex = {index}
                removeDetour = {this.props.removeDetour}
                setRoute = {this.props.setRoute}
                setTripSummary = {this.props.setTripSummary}
                setDetourList = {this.props.setDetourList}
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