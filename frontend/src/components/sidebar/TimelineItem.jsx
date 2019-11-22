import React from 'react';
import Button from '../Button'
import RouteRequester from '../../scripts/RouteRequester.js'

class TimelineItem extends React.Component {
    constructor(){
        super()

        this.removeDetour = this.removeDetour.bind(this);
        this.moveUp = this.moveUp.bind(this);
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
                this.props.setTripSummary(data.routes[0].summary);
                }
            })
            .catch(function(error) {
                console.log("Error: " + error);
            });
        
            this.props.removeDetour(this.props.detourIndex);
        }
    }

    moveUp(){
        // Only move up if the index is set and this isn't the first item
        var index = this.props.detourIndex;
        console.log(index);
        if(index > 0){
            var newIndex = index - 1;
            var newDetourList = []
            this.arrayMove(this.props.detourList, index, newIndex);
            this.props.detourList.forEach(detour => {
                newDetourList.push(detour);
            });
            this.props.setDetourList(newDetourList);
        }
        else{
            console.log("This is the first detour. It cannot be moved up");
        }
    }

    arrayMove(arr, old_index, new_index) {
        if (new_index >= arr.length) {
            var k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    };

    render() {

        var showDetourOptions = false;
        if(this.props.type === "detour"){
            showDetourOptions = true;
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
                    <div className="timeline-body">
                        {showDetourOptions ? (
                            <p><small className="text-muted">
                                {this.props.mutedText}
                            </small></p>
                        ): (<div></div>)}
                        {showDetourOptions ? (
                            <p><small className="text-muted">
                                {this.props.addedTimeTxt}
                            </small></p>
                        ): (<div></div>)}
                        {showDetourOptions ? (
                            <div>
                            <hr/>
                            <div className="container detour-edit-options">
                                <div className="row">
                                    <div className="col detour-edit-remove">
                                    <Button
                                            onClick={this.removeDetour}
                                            className = "btn-default btn btn-remove-detour"
                                            type = "button"
                                            id = "user-input-clear"
                                            text = "Remove">
                                    </Button> 
                                    </div>
                                    <div className="col-3 detour-edit-move">
                                        <button 
                                            className="btn detour-arrow-btn"
                                            onClick={this.moveUp}>
                                                <i className="fa fa-angle-up"></i>
                                        </button>
                                        <button
                                            className="btn detour-arrow-btn">
                                                <i className="fa fa-angle-down"></i>
                                        </button>
                                    </div>
                                </div>   
                            </div>
                            </div>
                        ): (<div></div>)}
                    </div>
                    
                </div>
            </li>
        )
    }
}

export default TimelineItem;