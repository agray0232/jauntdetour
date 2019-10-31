import React from "react";
import MapContainer from "./MapContainer";
import TripInput from "./TripInput";

class Main extends React.Component{
    render(){
        return(
        <div className="App">
            <TripInput></TripInput>
            <MapContainer></MapContainer>
        </div>
        )
    }
}

export default Main;