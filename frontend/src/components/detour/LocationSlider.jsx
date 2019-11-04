import React from 'react';

class LocationSlider extends React.Component {
    constructor(){
        super();

        // Bind 'this' to the updateDetourLocation method
        this.updateDetourLocation = this.updateDetourLocation.bind(this);
    }

    updateDetourLocation(value)
    {
        this.props.setDetourLocation(value);
    }

    render(){
        return(
            <div className="slidecontainer">
                <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    defaultValue="50"
                    onChange={(e) => this.updateDetourLocation(e.target.value)}
                    className="slider" 
                    id="myRange"></input>
            </div>
        )
    }
}

export default LocationSlider;