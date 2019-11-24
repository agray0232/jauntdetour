import React from 'react';
import DetourSettings from './DetourSettings';
import LocationSlider from './LocationSlider';
import RadiusSlider from './RadiusSlider';
import Button from '../Button';
import DetourRequester from '../../scripts/DetourRequester';

class DetourForm extends React.Component {
    constructor(){
        super();

        // Bind 'this' to the getDetours method
        this.getDetours = this.getDetours.bind(this);
    }

    getDetours(){
        var detourRequester = new DetourRequester();
        var routeCoordinates = this.props.route.overview_polyline.decodedPoints.map(point =>
            {
              return {lat: point[0], lng: point[1]}
            });
        var routeLength = routeCoordinates.length;
        var routeIndex = Math.floor(this.props.detourSearchLocation/100 * routeLength);
        var detourPoint = routeCoordinates[routeIndex];

        detourRequester.getDetours(detourPoint.lat, detourPoint.lng, this.props.detourSearchRadius, "Hike")
        .then(data => {

            this.props.setDetourOptions(data.results);

            var detourHighlight = [];
            data.results.forEach(result => {
                detourHighlight.push({id:result.id, highlight:false});
            })
            this.props.setDetourHighlight(detourHighlight);
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });
    }

    render(){
        return(
            <div className="detour-form container">
                <DetourSettings
                    setDetourType = {this.props.setDetourType}>
                </DetourSettings>
                <LocationSlider
                    setDetourSearchLocation = {this.props.setDetourSearchLocation}>
                </LocationSlider>
                <RadiusSlider
                    setDetourSearchRadius = {this.props.setDetourSearchRadius}>
                </RadiusSlider>
                <Button
                    onClick={this.getDetours}
                    className = "btn btn-primary main-button"
                    id = "get-detours-button"
                    text = "Get detours">
                </Button>
            </div>
        )
    }
}

export default DetourForm;