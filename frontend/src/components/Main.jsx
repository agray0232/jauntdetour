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
            setOrigin = {this.props.setOrigin}
            setDestination = {this.props.setDestination}
            setRoute = {this.props.setRoute}
            setDetourLocation = {this.props.setDetourLocation}
            setDetourRadius = {this.props.setDetourRadius}
            setDetourOptions = {this.props.setDetourOptions}
            setDetourHighlight = {this.props.setDetourHighlight}
            detourLocation = {this.props.detourLocation}
            detourRadius = {this.props.detourRadius}
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
                detourLocation = {this.props.detourLocation}
                detourRadius = {this.props.detourRadius}
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