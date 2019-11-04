import React from "react";
import MapContainer from "./MapContainer";
import UserInput from "./UserInput";
import Button from "./Button";
import DetourForm from "./detour/DetourForm";
import DetourOptions from "./detour/DetourOptions";

class Main extends React.Component{
    render(){
        return(
        <div className="App">
            <UserInput 
                origin = {this.props.origin}
                destination = {this.props.destination}
                setOrigin = {this.props.setOrigin}
                setDestination = {this.props.setDestination}
                setRoute = {this.props.setRoute}>
            </UserInput>
            <Button
            disabledCriteria={!this.props.showDetourButton}
            onClick={this.props.getDetourForm}
            className = "main-button"
            id = "add-detour-button"
            text = "+ Add Detour">
            </Button>
            {this.props.showDetourForm ? (
              <DetourForm
                setDetourLocation = {this.props.setDetourLocation}
                setDetourRadius = {this.props.setDetourRadius}
                setDetourOptions = {this.props.setDetourOptions}
                detourLocation = {this.props.detourLocation}
                detourRadius = {this.props.detourRadius}
                route = {this.props.route}>
              </DetourForm>
            ): (<div></div>)}  
            {this.props.showDetourOptions ? (
              <DetourOptions
                origin = {this.props.origin}
                destination = {this.props.destination}
                detourOptions = {this.props.detourOptions}
                setRoute = {this.props.setRoute}
                clearDetourOptions = {this.props.clearDetourOptions}>
              </DetourOptions>
            ): (<div></div>)}  
            <MapContainer
                showRoute = {this.props.showRoute}
                showDetourPoint = {this.props.showDetourPoint}
                detourLocation = {this.props.detourLocation}
                detourRadius = {this.props.detourRadius}
                detourOptions = {this.props.detourOptions}
                route = {this.props.route}>
            </MapContainer>
            
        </div>
        )
    }
}

export default Main;