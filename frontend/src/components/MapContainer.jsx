import React from 'react';
import { Map, Circle , Polyline, Marker, GoogleApiWrapper } from 'google-maps-react';

class MapContainer extends React.Component {
  
  constructor(props) {
    super(props);

    this.state = {
      mapStyle: {
        width: '100%',
        height: '75%'
      }
    }
  }

    render() {

      if(this.props.showRoute)
      {
        var routeCoordinates = this.props.route.overview_polyline.decodedPoints.map(point =>
          {
            return {lat: point[0], lng: point[1]}
          });
      }

      if(this.props.showDetourPoint && this.props.showRoute)
      {
        var detourPoint = {};
        var routeLength = routeCoordinates.length;
        var routeIndex = Math.floor(this.props.detourLocation/100 * routeLength);
        detourPoint = routeCoordinates[routeIndex];
      }
      return (
          <Map
            google={this.props.google}
            zoom={9}
            style={this.state.mapStyle}
            initialCenter={{ lat: 33.749, lng: -84.388}}
          >
            {this.props.showRoute ? (
              <Polyline
                    defaultPosition={this.props.center}
                    path= {routeCoordinates}
                    geodesic= {true}
                    strokeColor= {"#007bff"}
                    strokeOpacity= {1.0}
                    strokeWeight= {5}
                />
            ): (<div></div>)}
            {this.props.showDetourPoint ? (
              <Marker
                    position={detourPoint}
                />
            ): (<div></div>)}
            {this.props.showDetourPoint ? (
              <Circle
              radius={parseFloat(this.props.detourRadius)}
              center={detourPoint}
              strokeColor='transparent'
              strokeOpacity={0}
              strokeWeight={5}
              fillColor='#FF0000'
              fillOpacity={0.2}
            />
            ): (<div></div>)}
            
          </Map>
      );
    }
}

export default GoogleApiWrapper({
    apiKey: 'AIzaSyArWVAF5NWcXq8RenpdK2vtTZNSX3zaKG4'
  })(MapContainer);