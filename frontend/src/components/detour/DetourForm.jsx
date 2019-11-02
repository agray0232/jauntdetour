import React from 'react';
import LocationSlider from './LocationSlider';
import RadiusSlider from './RadiusSlider';

class DetourForm extends React.Component {
    constructor(){
        super();
    }

    render(){
        return(
            <div>
                Detour Location
                <LocationSlider
                    setDetourLocation = {this.props.setDetourLocation}>
                </LocationSlider>
                Detour Radius
                <RadiusSlider
                    setDetourRadius = {this.props.setDetourRadius}>
                </RadiusSlider>
            </div>
        )
    }
}

export default DetourForm;