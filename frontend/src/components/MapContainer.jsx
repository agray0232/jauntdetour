import React from 'react';
import { Map, Polyline, GoogleApiWrapper } from 'google-maps-react';

class MapContainer extends React.Component {
  
  constructor(props) {
    super(props);

    this.state = {
      route: [],
      mapStyle: {
        width: '90%',
        height: '90%'
      }
    }
  }

    render() {

        return (
            <Map
              google={this.props.google}
              zoom={8}
              style={this.state.mapStyle}
              initialCenter={{ lat: 33.749, lng: -84.388}}
            />
        );
      }
}

export default GoogleApiWrapper({
    apiKey: 'AIzaSyArWVAF5NWcXq8RenpdK2vtTZNSX3zaKG4'
  })(MapContainer);