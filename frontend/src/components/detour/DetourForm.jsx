import React from 'react';
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
        var routeIndex = Math.floor(this.props.detourLocation/100 * routeLength);
        var detourPoint = routeCoordinates[routeIndex];

        detourRequester.getDetours(detourPoint.lat, detourPoint.lng, this.props.detourRadius, "Hike")
        .then(data => {
            this.props.setDetourOptions(data.results);
          })
          .catch(function(error) {
            console.log("Error: " + error);
          });
    }

    render(){
        return(
            <div className="detour-form container">
                <h4>Detour Options</h4>
                <LocationSlider
                    setDetourLocation = {this.props.setDetourLocation}>
                </LocationSlider>
                <RadiusSlider
                    setDetourRadius = {this.props.setDetourRadius}>
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