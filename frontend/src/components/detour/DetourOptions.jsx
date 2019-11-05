import React from 'react';
import Detour from './Detour';

class DetourOptions extends React.Component {
    constructor(){
        super();
    }

    render(){
        var detourOptions = this.props.detourOptions.map(option =>
            {
                var optionLat = option.geometry.location.lat;
                var optionLng = option.geometry.location.lng;
                var optionId = option.id;
                var optionPlaceId = option.place_id;

              return (
                  <Detour
                     detourOptions = {this.props.detourOptions}
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
                     clearDetourOptions = {this.props.clearDetourOptions}
                     >
                    </Detour>
              )
            });

        return(
            <div className="detour-options">
                <div className="container">
                    <h4>Detour Options</h4>
                </div>
                <ul className="detour-options-list list-group">
                    {detourOptions}
                </ul>
            </div>
        )
    }
}

export default DetourOptions;