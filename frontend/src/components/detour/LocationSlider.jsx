import React from 'react';

class LocationSlider extends React.Component {
    constructor(){
        super();
    }

    render(){
        return(
            <div class="slidecontainer">
                <input type="range" min="1" max="100" class="slider" id="myRange"></input>
            </div>
        )
    }
}

export default LocationSlider;