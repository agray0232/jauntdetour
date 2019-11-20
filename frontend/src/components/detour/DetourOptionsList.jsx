import React from 'react';
import DetourOption from './DetourOption';

class DetourOptionsList extends React.Component {

    render(){
        var detourOptionsList = this.props.detourOptions.map(option =>
            {
                var optionLat = option.geometry.location.lat;
                var optionLng = option.geometry.location.lng;
                var optionId = option.id;
                var optionPlaceId = option.place_id;

              return (
                  <DetourOption
                     detourOptions = {this.props.detourOptions}
                     detourList = {this.props.detourList}
                     detourHighlight = {this.props.detourHighlight}
                     origin = {this.props.origin}
                     destination = {this.props.destination}
                     tripSummary = {this.props.tripSummary}
                     name = {option.name}
                     lat = {optionLat}
                     lng = {optionLng}
                     id = {optionId}
                     rating = {option.rating}
                     placeId = {optionPlaceId}
                     setRoute = {this.props.setRoute}
                     setTripSummary = {this.props.setTripSummary}
                     addDetour = {this.props.addDetour}
                     setDetourOptions = {this.props.setDetourOptions}
                     setDetourHighlight = {this.props.setDetourHighlight}
                     clearDetourOptions = {this.props.clearDetourOptions}
                     >
                    </DetourOption>
              )
            });

        return(
            <div className="detour-options">
                <div className="container">
                    <h4>Detour Options</h4>
                </div>
                <ul className="detour-options-list list-group">
                    {detourOptionsList}
                </ul>
            </div>
        )
    }
}

export default DetourOptionsList;