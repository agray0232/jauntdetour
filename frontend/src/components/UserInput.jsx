import React from 'react';
import RouteRequester from '../scripts/RouteRequester.js'

class TripInput extends React.Component {

    constructor() {
        super();

        // Bind 'this' to the requestRoute method
        this.requestRoute = this.requestRoute.bind(this);
    }

    requestRoute(e){
        e.preventDefault();
        var origin = e.target[0].value;
        var destination = e.target[1].value;
        this.props.setOrigin(origin);
        this.props.setDestination(destination);
        var routeRequester = new RouteRequester();
        routeRequester.getRoute(origin, destination, "Address", {})
        .then(data => {
            if(data.routes.length > 0){
              this.props.setRoute(data.routes[0]);
            }
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });
    }

    render() {
        return (
          <div>
            <form onSubmit={this.requestRoute}>
              Origin: <input type="text"/>
              Destination: <input type="text"/>
              <input type="submit" value="Submit" />
            </form>
            <div>
              <p>Your origin is: {this.props.origin}</p>
              <p>Your destination is: {this.props.destination}</p>
            </div>
          </div>
        )
    }
}

export default TripInput;