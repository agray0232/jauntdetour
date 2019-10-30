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
        var routeRequester = new RouteRequester();
        routeRequester.getRoute(origin, destination, "Address")
        .then(data => {
            console.log(data);
            console.log(data.routes);
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });
    }

    render() {
        return (
            <form onSubmit={this.requestRoute}>
              Origin: <input type="text"/>
              Destination: <input type="text"/>
            <input type="submit" value="Submit" />
          </form>
        )
    }
}

export default TripInput;