import React from 'react';
import Button from "../Button"
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
                    <div className="container">
                        <div className="row">
                            <div className="col">
                                <p>Distance: {this.props.baseTripSummary.distance} mi</p>
                                <p>Time: {this.props.baseTripSummary.time.hours} hr {this.props.baseTripSummary.time.min} min</p>
                            </div>
                            <div className="col-4">
                                <Button
                                    onClick={this.props.clearAll}
                                    className = "btn btn-danger btn-clear"
                                    type = "button"
                                    id = "user-input-clear"
                                    text = "Clear">
                                </Button>
                            </div>
                        </div>
                    </div>
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