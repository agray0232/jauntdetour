import React from 'react';

class DetourSettings extends React.Component {
    constructor(){
        super();

        this.changeDetourType = this.changeDetourType.bind(this);
    }

    changeDetourType(event){
        this.props.setDetourType(event.target.value);
    }

    render(){
        return(
            <div className="detour-settings">
                <h4>Detour Settings</h4>
                <select className="browser-default custom-select" onChange={this.chageDetourType}>
                    <option defaultValue>Select Detour Type</option>
                    <option value="Hike">Hike</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Museum">Museum</option>
                </select>
            </div>
        )
    }
}

export default DetourSettings;