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

    this.adjustMap = this.adjustMap.bind(this);
  }

  adjustMap(mapProps, map) {
    console.log("Adjusted map");
    if(this.props.route.legth > 0){
      const {google, markers} = mapProps;
      const bounds = new google.maps.LatLngBounds();
    
      const ne_lat = this.props.route.bounds.northeast.lat;
      const ne_lng = this.props.route.bounds.northeast.lng;
      const sw_lat = this.props.route.bounds.southwest.lat;
      const sw_lng = this.props.route.bounds.southwest.lng;
      bounds.extend(new google.maps.LatLng(ne_lat, ne_lng));
      bounds.extend(new google.maps.LatLng(sw_lat, sw_lng));
    
      map.fitBounds(bounds);
      // map.panToBounds(bounds);
    }
  }

    render() {

      if(this.props.showRoute)
      {
        var routeCoordinates = this.props.route.overview_polyline.complete_overview.map(point =>
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

      var showDetourOptions = false;
      if(this.props.detourOptions.length > 0){
        showDetourOptions = true;
        var detourOptions = this.props.detourOptions.map(detour =>
          {
            return (
              <Marker
                position={
                  {lat: detour.geometry.location.lat, 
                  lng: detour.geometry.location.lng}}>
              </Marker>)
          })
      }

      return (
          <Map
            google={this.props.google}
            zoom={9}
            style={this.state.mapStyle}
            initialCenter={{ lat: 33.749, lng: -84.388}}
            onReady={this.adjustMap}
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
            {showDetourOptions ? (
              detourOptions
            ): (<div></div>)}
            
          </Map>
      );
    }
}

export default GoogleApiWrapper({
    apiKey: 'AIzaSyArWVAF5NWcXq8RenpdK2vtTZNSX3zaKG4'
  })(MapContainer);