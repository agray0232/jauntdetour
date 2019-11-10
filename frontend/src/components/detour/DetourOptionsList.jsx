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
                     detourHighlight = {this.props.detourHighlight}
                     origin = {this.props.origin}
                     destination = {this.props.destination}
                     name = {option.name}
                     lat = {optionLat}
                     lng = {optionLng}
                     id = {optionId}
                     rating = {option.rating}
                     placeId = {optionPlaceId}
                     setRoute = {this.props.setRoute}
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