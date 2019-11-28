import React from 'react';
import { Map, Circle , Polyline, Marker, GoogleApiWrapper } from 'google-maps-react';

class MapContainer extends React.Component {
  
  constructor(props) {
    super(props);

    this.state = {
      mapStyle: {
        position: 'relative',
        width: '100%',
        height: '100%'
      }
    }

    this.adjustMap = this.adjustMap.bind(this);
  }

  adjustMap(mapProps, map) {
    
    if(this.props.route.legth > 0){
      // Could include "markers" below
      const {google} = mapProps;
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

      // If a we are to show a route, go through the route's overview polyline and map it to lat lng points to be
      // Ingested by the Map component
      if(this.props.showRoute)
      {
        var routeCoordinates = this.props.route.overview_polyline.complete_overview.map(point =>
          {
            return {lat: point[0], lng: point[1]}
          });
      }

      // If showDetourSearchPoint and showRoute are set, set the search point to be at a percentage of the route
      // as determined by the detourSearchLocation property
      if(this.props.showDetourSearchPoint && this.props.showRoute)
      {
        var detourPoint = {};
        
        var routeLength = routeCoordinates.length;
        var routeIndex = Math.floor(this.props.detourSearchLocation/100 * routeLength) - 1;
        detourPoint = routeCoordinates[routeIndex];
      }

      // Initiaze this boolean to false
      var showDetourOptions = false;

      // If the detourOptions property has elements, map each one to a google maps Marker
      if(this.props.detourOptions.length > 0){
        showDetourOptions = true;
        var detourOptions = this.props.detourOptions.map(detour =>
          {
            // Initialize a highlight boolean as false
            var highlight = false;
             // Go through the detourHighlight array. When the detour in the array matches the current detour,
             // Set the highlight property as the value in the array
            this.props.detourHighlight.forEach(detourHighlight => {
              if(detourHighlight.id === detour.id){
                //console.log("setting highlight as " + detourHighlight);
                highlight = detourHighlight.highlight;
              }
            })
            
            // Initialize the icon object
            var icon = {};

            // Set the icon values according to if the icon should be highlighted or not
            if(highlight){
              icon = {
                url: 'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|FF0000|40|_|%E2%80%A2', // url
                scaledSize: new this.props.google.maps.Size(20, 30), // scaled size
              };
            }
            else{
              icon = {
                url: 'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|0091ff|40|_|%E2%80%A2', // url
                scaledSize: new this.props.google.maps.Size(20, 30), // scaled size
              };
            }
            
            // Return a google maps Marker
            return (
              <Marker
                position={
                  {lat: detour.geometry.location.lat, 
                  lng: detour.geometry.location.lng}}
                icon={icon}>
              </Marker>)
          })
      }

      // Initialize showDetourList to false
      var showDetours = false;

      if(this.props.detourList.length > 0){
        showDetours = true;
        // Map the detours to markers
        var detours = this.props.detourList.map(detour => {
          // Set the icon as the non highlighted detour option icon
          var icon = {
            url: 'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|0091ff|40|_|%E2%80%A2', // url
            scaledSize: new this.props.google.maps.Size(20, 30), // scaled size
          };

          // Return a google maps Marker
          return (
            <Marker
              position={
                {lat: detour.lat, 
                lng: detour.lng}}
              icon={icon}>
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
            {this.props.showDetourSearchPoint ? (
              <Marker
                    position={detourPoint}
                    color="#3349FF"
                />
            ): (<div></div>)}
            {this.props.showDetourSearchPoint ? (
              <Circle
              radius={parseFloat(this.props.detourSearchRadius)}
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
            {showDetours ? (
              detours
            ): (<div></div>)}
            
          </Map>
      );
    }
}

export default GoogleApiWrapper({
    apiKey: 'AIzaSyArWVAF5NWcXq8RenpdK2vtTZNSX3zaKG4'
  })(MapContainer);