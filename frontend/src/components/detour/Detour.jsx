import React from 'react';
import Button from '../Button';
import RouteRequester from '../../scripts/RouteRequester.js'

class Detour extends React.Component {
    constructor(){
        super();

        // Bind 'this' to the addDetour method
        this.addDetour = this.addDetour.bind(this);
        this.highlight = this.highlight.bind(this);
    }

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

    addDetour(){
        var routeRequester = new RouteRequester();
        routeRequester.getRoute(
            this.props.origin, 
            this.props.destination, 
            "Address", 
            {waypoint:{placeId:this.props.placeId}})
        .then(data => {
            if(data.routes.length > 0){
              this.props.setRoute(data.routes[0]);
              this.props.clearDetourOptions();
            }
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });
    }

    render(){
        return(
            <li onMouseEnter={this.highlight} className="list-group-item list-group-hover" key={this.props.id.toString()}>
                <div className="row">
                    <div className="col">
                        <h5>{this.props.name}</h5>
                        <p>Rating: {this.props.rating}</p>
                    </div>
                    <div className="col-3">
                        <Button
                            onClick={this.addDetour}
                            className = "btn detour-option-btn"
                            id = "${option.name}-detour-button"
                            text = "+">
                        </Button>
                    </div>
                </div>
                
            </li>
        )
    }
}

export default Detour;