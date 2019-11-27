import React from 'react';
import Button from "../Button"
import TripTimeline from './TripTimeline';

class TripSummary extends React.Component {

    render() {

        var showTripSummary = false;
        if(Object.entries(this.props.tripSummary).length !== 0)
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
                                <p>Distance: {this.props.tripSummary.distance} mi</p>
                                <p>Time: {this.props.tripSummary.time.hours} hr {this.props.tripSummary.time.min} min</p>
                            </div>
                            <div className="col-4">
                            </div>
                        </div>
                    </div>
                    <TripTimeline
                        origin = {this.props.origin}
                        destination = {this.props.destination}
                        detourList = {this.props.detourList}
                        removeDetour = {this.props.removeDetour}
                        setRoute = {this.props.setRoute}
                        setTripSummary = {this.props.setTripSummary}
                        setDetourList = {this.props.setDetourList}>    
                    </TripTimeline>
                </div>
                ): (<div></div>)}  
            </div>
        )
    }
}

export default TripSummary;