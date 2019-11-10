import React from "react";
import MapContainer from "./MapContainer";
import Sidebar from "./sidebar/Sidebar";

class Main extends React.Component{
    render(){
        return(
        <div className="app-container row">
          <Sidebar
            origin = {this.props.origin}
            destination = {this.props.destination}
            baseTripSummary = {this.props.baseTripSummary}
            setOrigin = {this.props.setOrigin}
            setDestination = {this.props.setDestination}
            setRoute = {this.props.setRoute}
            setBaseTripSummary = {this.props.setBaseTripSummary}
            setDetourSearchLocation = {this.props.setDetourSearchLocation}
            setDetourSearchRadius = {this.props.setDetourSearchRadius}
            setDetourOptions = {this.props.setDetourOptions}
            setDetourHighlight = {this.props.setDetourHighlight}
            detourSearchLocation = {this.props.detourSearchLocation}
            detourSearchRadius = {this.props.detourSearchRadius}
            route = {this.props.route}
            showDetourButton = {this.props.showDetourButton}
            showDetourForm = {this.props.showDetourForm}
            showDetourOptions = {this.props.showDetourOptions}
            getDetourForm = {this.props.getDetourForm}
            detourOptions = {this.props.detourOptions}
            detourHighlight = {this.props.detourHighlight}
            clearDetourOptions = {this.props.clearDetourOptions}>
          </Sidebar>
          <div className="map-container">
            <MapContainer
                showRoute = {this.props.showRoute}
                showDetourPoint = {this.props.showDetourPoint}
                detourSearchLocation = {this.props.detourSearchLocation}
                detourSearchRadius = {this.props.detourSearchRadius}
                detourOptions = {this.props.detourOptions}
                detourHighlight = {this.props.detourHighlight}
                route = {this.props.route}>
            </MapContainer>
          </div>
        </div>
        )
    }
}

export default Main;