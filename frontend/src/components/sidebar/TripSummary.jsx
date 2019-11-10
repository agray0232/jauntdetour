import React from 'react';

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
                    <p>Origin: {this.props.origin}</p>
                    <p>Destination: {this.props.destination}</p>
                    <p>Distance: {this.props.baseTripSummary.distance}</p>
                    <p>Time: {this.props.baseTripSummary.time.hours} hr {this.props.baseTripSummary.time.min} min</p>
                </div>
                ): (<div></div>)}  
            </div>
        )
    }
}

export default TripSummary;