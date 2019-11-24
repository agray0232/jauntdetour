import React from 'react';
import UserInput from "./UserInput";
import TripSummary from "./TripSummary";
import Button from "../Button";
import DetourForm from "../detour/DetourForm";
import DetourOptionsList from "../detour/DetourOptionsList";

class Sidebar extends React.Component {

    render(){
        return(
            <div className="side-bar">
            <UserInput 
                origin = {this.props.origin}
                destination = {this.props.destination}
                setOrigin = {this.props.setOrigin}
                setDestination = {this.props.setDestination}
                setRoute = {this.props.setRoute}
                setTripSummary = {this.props.setTripSummary}>
            </UserInput>
            <TripSummary
            origin = {this.props.origin}
            destination = {this.props.destination}
            tripSummary = {this.props.tripSummary}
            detourList = {this.props.detourList}
            removeDetour = {this.props.removeDetour}
            setRoute = {this.props.setRoute}
            setTripSummary = {this.props.setTripSummary}
            setDetourList = {this.props.setDetourList}
            clearAll = {this.props.clearAll}>
            </TripSummary>
            {this.props.showDetourForm ? (
              <DetourForm
                setDetourSearchLocation = {this.props.setDetourSearchLocation}
                setDetourSearchRadius = {this.props.setDetourSearchRadius}
                setDetourType = {this.props.setDetourType}
                setDetourOptions = {this.props.setDetourOptions}
                setDetourHighlight = {this.props.setDetourHighlight}
                detourSearchLocation = {this.props.detourSearchLocation}
                detourSearchRadius = {this.props.detourSearchRadius}
                route = {this.props.route}>
              </DetourForm>
            ): (
            <div className="container add-detour-container">
              <Button
                disabledCriteria={!this.props.showDetourButton}
                onClick={this.props.getDetourForm}
                className = "btn btn-primary add-detour-btn"
                id = "add-detour-button"
                text = "+ Add Detour">
              </Button>
            </div>            
            )}  
            {this.props.showDetourOptions ? (
              <DetourOptionsList
                origin = {this.props.origin}
                destination = {this.props.destination}
                tripSummary = {this.props.tripSummary}
                detourOptions = {this.props.detourOptions}
                detourList = {this.props.detourList}
                detourHighlight = {this.props.detourHighlight}
                addDetour = {this.props.addDetour}
                setRoute = {this.props.setRoute}
                setTripSummary = {this.props.setTripSummary}
                setDetourOptions = {this.props.setDetourOptions}
                setDetourHighlight = {this.props.setDetourHighlight}
                clearDetourOptions = {this.props.clearDetourOptions}>
              </DetourOptionsList>
            ): (<div></div>)}  
          </div>
        )
    }
}

export default Sidebar;