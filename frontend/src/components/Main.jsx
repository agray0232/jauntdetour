import React from "react";
import MapContainer from "./MapContainer";
import TripInput from "./TripInput";

class Main extends React.Component{
    render(){
        return(
        <div className="App">
            <TripInput 
                origin = {this.props.origin}
                destination = {this.props.destination}
                setOrigin = {this.props.setOrigin}
                setDestination = {this.props.setDestination}
                setRoute = {this.props.setRoute}>
            </TripInput>
            <MapContainer
                showRoute = {this.props.showRoute}
                route = {this.props.route}>
            </MapContainer>
           
        </div>
        )
    }
}

export default Main;