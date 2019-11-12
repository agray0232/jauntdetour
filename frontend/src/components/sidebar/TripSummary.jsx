import React from 'react';
import TripTimeline from './TripTimeline';

class TripSummary extends React.Component {

    render() {

        var showTripSummary = false;
        if(Object.entries(this.props.baseTripSummary).length !== 0)
        {
            showTripSummary = true;
        }

        return (
            <div>
                {showTripSummary ? (
                <div className="trip-summary">
                    <p>Distance: {this.props.baseTripSummary.distance} mi</p>
                    <p>Time: {this.props.baseTripSummary.time.hours} hr {this.props.baseTripSummary.time.min} min</p>
                    <TripTimeline
                        origin = {this.props.origin}
                        destination = {this.props.destination}
                        detourList = {this.props.detourList}>    
                    </TripTimeline>
                </div>
                ): (<div></div>)}  
            </div>
        )
    }
}

export default TripSummary;