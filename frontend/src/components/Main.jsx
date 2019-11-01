import React from "react";
import MapContainer from "./MapContainer";
import UserInput from "./UserInput";
import Button from "./Button";
import DetourForm from "./detour/DetourForm";

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
            id = "get-hikes-button"
            text = "+ Add Detour">
            </Button>
            {this.props.showDetourForm ? (
              <DetourForm>

              </DetourForm>
            ): (<div></div>)}  
            <MapContainer
                showRoute = {this.props.showRoute}
                route = {this.props.route}>
            </MapContainer>
           
        </div>
        )
    }
}

export default Main;