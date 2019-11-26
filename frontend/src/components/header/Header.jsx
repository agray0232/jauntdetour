import React from 'react';
import UserInput from "../UserInput";

class Header extends React.Component {

    render(){
        return(
          <div className="header row">
            <UserInput 
                type = "mobile"
                classes = "user-input-mobile"
                origin = {this.props.origin}
                destination = {this.props.destination}
                setOrigin = {this.props.setOrigin}
                setDestination = {this.props.setDestination}
                setRoute = {this.props.setRoute}
                setTripSummary = {this.props.setTripSummary}>
            </UserInput> 
          </div>
        )
    }
}

export default Header;