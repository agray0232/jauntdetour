import React from 'react';
import Button from '../Button';
import RouteRequester from '../../scripts/RouteRequester.js'

class DetourOption extends React.Component {
    constructor(){
        super();

        // Bind 'this' to the addDetour method
        this.addDetour = this.addDetour.bind(this);
        this.highlight = this.highlight.bind(this);
    }
;
    highlight(){
        var newDetourHighlight = [];
            this.props.detourHighlight.forEach(detour => {
                var newHighlight = false
                if(detour.id === this.props.id)
                {
                    newHighlight = true;
                }
                newDetourHighlight.push({id:detour.id, highlight:newHighlight});
            })
            this.props.setDetourHighlight(newDetourHighlight);
    }

    calcAddedTime(summary){
        var originalMin = this.props.tripSummary.time.hours * 60 + this.props.tripSummary.time.min;
        var newMin = summary.time.hours * 60 + summary.time.min;
        var addedMin = newMin - originalMin;

        return addedMin;
    }

    addDetour(){ 
        var waypointList = [];
        var addedMin = 0;

        this.props.detourList.forEach(detour => {
            waypointList.push(detour.placeId);
        })
        waypointList.push(this.props.placeId);
        
        var routeRequester = new RouteRequester();
        routeRequester.getRoute(
            this.props.origin, 
            this.props.destination, 
            "Address", 
            {waypoints: waypointList})
        .then(data => {
            if(data.routes.length > 0){
              this.props.setRoute(data.routes[0]);
              addedMin = this.calcAddedTime(data.routes[0].summary)
              this.props.setTripSummary(data.routes[0].summary)
              this.props.clearDetourOptions();
            }

            this.props.addDetour({
                name : this.props.name,
                type: this.props.type,
                lat : this.props.lat,
                lng : this.props.lng,
                id : this.props.id,
                rating : this.props.rating,
                placeId : this.props.placeId,
                addedTime: addedMin
            })
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });


    }

    render(){
        return(
            <li onMouseEnter={this.highlight} className="list-group-item list-group-hover" key={this.props.id}>
                <div className="row">
                    <div className="col">
                        <h5>{this.props.name}</h5>
                        <p>Rating: {this.props.rating}</p>
                    </div>
                    <div className="col-3">
                        <Button
                            onClick={this.addDetour}
                            className = "btn detour-option-btn"
                            id = "{this.name}-detour-button"
                            text = "+">
                        </Button>
                    </div>
                </div>
                
            </li>
        )
    }
}

export default DetourOption;