import React from 'react';
import Button from '../Button';
import RouteRequester from '../../scripts/RouteRequester.js'

class Detour extends React.Component {
    constructor(){
        super();

        // Bind 'this' to the addDetour method
        this.addDetour = this.addDetour.bind(this);
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
            }
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });
    }

    render(){
        return(
            <li key={this.props.id.toString()}>
                <p>{this.props.name}</p>
                <Button
                onClick={this.addDetour}
                className = "detour-button"
                id = "${option.name}-detour-button"
                text = "Add detour">
                </Button>
            </li>
        )
    }
}

export default Detour;