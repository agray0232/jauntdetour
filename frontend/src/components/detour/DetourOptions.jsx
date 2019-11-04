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
                     origin = {this.props.origin}
                     destination = {this.props.destination}
                     name = {option.name}
                     lat = {optionLat}
                     lng = {optionLng}
                     id = {optionId}
                     placeId = {optionPlaceId}
                     setRoute = {this.props.setRoute}
                     >
                    </Detour>
              )
            });

        return(
            <div>
                <p>Detour Options</p>
                <ul>
                    {detourOptions}
                </ul>
            </div>
        )
    }
}

export default DetourOptions;