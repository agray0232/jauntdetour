import React from 'react';
import UserInput from "./UserInput";
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
                setRoute = {this.props.setRoute}>
            </UserInput>
            {this.props.showDetourForm ? (
              <DetourForm
                setDetourSearchLocation = {this.props.setDetourSearchLocation}
                setDetourSearchRadius = {this.props.setDetourSearchRadius}
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
                detourOptions = {this.props.detourOptions}
                detourHighlight = {this.props.detourHighlight}
                setRoute = {this.props.setRoute}
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