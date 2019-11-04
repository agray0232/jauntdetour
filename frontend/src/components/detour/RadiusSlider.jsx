import React from 'react';

class RadiusSlider extends React.Component {
    constructor(){
        super();

        // Bind 'this' to the updateDetourLocation method
        this.updateDetourRadius = this.updateDetourRadius.bind(this);
    }

    updateDetourRadius(value)
    {
        this.props.setDetourRadius(value);
    }

    render(){
        return(
            <div className="slidecontainer">
                <input 
                    type="range" 
                    min="1" 
                    max="100000" 
                    defaultValue="50"
                    onChange={(e) => this.updateDetourRadius(e.target.value)}
                    className="slider" 
                    id="detourRadius"></input>
            </div>
        )
    }
}

export default RadiusSlider;