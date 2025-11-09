import React from "react";

class DetourSettings extends React.Component {
  constructor() {
    super();

    this.changeDetourType = this.changeDetourType.bind(this);
  }

  changeDetourType(event) {
    this.props.setDetourType(event.target.value);
  }

  render() {
    return (
      <div className="detour-settings">
        <h4>Detour Settings</h4>
        <select
          className="browser-default custom-select"
          onChange={this.changeDetourType}
        >
          <option defaultValue="Hike">Hike</option>
          <option value="Coffee">Coffee</option>
          <option value="Museum">Museum</option>
          <option value="Landmark">Landmark</option>
          <option value="Restaurant">Restaurant</option>
          <option value="Bar">Bar</option>
          <option value="Gas Station">Gas Station</option>
          <option value="Charging Station">Charging Station</option>
        </select>
      </div>
    );
  }
}

export default DetourSettings;
