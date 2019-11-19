import React from 'react';
import Button from '../Button'
import RouteRequester from '../../scripts/RouteRequester.js'

class TimelineItem extends React.Component {
    constructor(){
        super()

        this.removeDetour = this.removeDetour.bind(this);
    }

    removeDetour(){
        var detourIndex = this.props.detourIndex;

        if(detourIndex >= 0){

            var newDetourList = this.props.detourList.filter(function(detour, index){
                return index !== detourIndex;
            })

            var waypointList = [];

            newDetourList.forEach(detour => {
                waypointList.push(detour.placeId);
            })
            
            var routeRequester = new RouteRequester();
            routeRequester.getRoute(
                this.props.origin, 
                this.props.destination, 
                "Address", 
                {waypoints: waypointList})
            .then(data => {
                if(data.routes.length > 0){
                this.props.setRoute(data.routes[0]);
                }
            })
            .catch(function(error) {
                console.log("Error: " + error);
            });
        
            this.props.removeDetour(this.props.detourIndex);
        }
    }

    render() {

        var showDetourEditOptions = false;
        if(this.props.type === "detour"){
            showDetourEditOptions = true;
        }

        return (
            <li className="timeline-inverted">
                <div className={this.props.badgeClass}>
                    <span className="glyphicon glyphicon-search" aria-hidden="true"></span>
                </div>
                <div className="timeline-panel">
                    <div className="timeline-heading">
                    <h5 className="timeline-title">{this.props.title}</h5>
                    </div>
                    <div className="row">
                        <div className="col-9"> 
                            <p><small className="text-muted">
                                <i className="glyphicon glyphicon-time"></i> 
                                {this.props.mutedText}
                            </small></p>
                        </div>
                        {showDetourEditOptions ? (
                        <div className="col-3">
                           <Button
                                onClick={this.removeDetour}
                                className = "btn-default btn btn-remove-detour"
                                type = "button"
                                id = "user-input-clear"
                                text = "Remove">
                            </Button> 
                        </div>
                        ): (<div></div>)}
                    </div>
                   

                    
                </div>
            </li>
        )
    }
}

export default TimelineItem;