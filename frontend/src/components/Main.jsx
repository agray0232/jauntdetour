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
            tripSummary = {this.props.tripSummary}
            setOrigin = {this.props.setOrigin}
            setDestination = {this.props.setDestination}
            setRoute = {this.props.setRoute}
            setTripSummary = {this.props.setTripSummary}
            setDetourSearchLocation = {this.props.setDetourSearchLocation}
            setDetourSearchRadius = {this.props.setDetourSearchRadius}
            setDetourOptions = {this.props.setDetourOptions}
            setDetourHighlight = {this.props.setDetourHighlight}
            setDetourList = {this.props.setDetourList}
            detourSearchLocation = {this.props.detourSearchLocation}
            detourSearchRadius = {this.props.detourSearchRadius}
            addDetour = {this.props.addDetour}
            removeDetour = {this.props.removeDetour}
            detourList = {this.props.detourList}
            route = {this.props.route}
            showDetourButton = {this.props.showDetourButton}
            showDetourForm = {this.props.showDetourForm}
            showDetourOptions = {this.props.showDetourOptions}
            getDetourForm = {this.props.getDetourForm}
            detourOptions = {this.props.detourOptions}
            detourHighlight = {this.props.detourHighlight}
            clearDetourOptions = {this.props.clearDetourOptions}
            clearAll = {this.props.clearAll}>
          </Sidebar>
          <div className="map-container">
            <MapContainer
                showRoute = {this.props.showRoute}
                showDetourSearchPoint = {this.props.showDetourSearchPoint}
                detourSearchLocation = {this.props.detourSearchLocation}
                detourSearchRadius = {this.props.detourSearchRadius}
                detourOptions = {this.props.detourOptions}
                detourHighlight = {this.props.detourHighlight}
                detourList = {this.props.detourList}
                route = {this.props.route}>
            </MapContainer>
          </div>
        </div>
        )
    }
}

export default Main;