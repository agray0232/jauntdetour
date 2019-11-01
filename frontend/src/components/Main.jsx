import React from "react";
import MapContainer from "./MapContainer";
import UserInput from "./UserInput";
import Button from "./Button";

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
            disabledCriteria={!this.props.showHikesButton}
            className = "main-button"
            id = "get-hikes-button"
            text = "Find Hikes">
            </Button>
            <MapContainer
                showRoute = {this.props.showRoute}
                route = {this.props.route}>
            </MapContainer>
           
        </div>
        )
    }
}

export default Main;