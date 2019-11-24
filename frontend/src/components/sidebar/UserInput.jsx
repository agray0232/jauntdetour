import React from 'react';
import RouteRequester from '../../scripts/RouteRequester.js'

class TripInput extends React.Component {

    constructor() {
        super();

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
              this.props.setTripSummary(data.routes[0].summary);
            }
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });
    }

    render() {
        return (
          <div className="user-input container">
            <form onSubmit={this.requestRoute}>
              <div className="form-group ">
                <input className="form-control-lg route-input" type="text" placeholder="Origin"/>
              </div>
              <div className="form-group">
                <input className="form-control-lg route-input" type="text" placeholder="Destination"/>
              </div>
                  <div className="form-group ">
                    <input className="btn-default form-control-lg route-submit" type="submit" value="Get Route" />
                  </div>
            </form>
          </div>
        )
    }
}

export default TripInput;