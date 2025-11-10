import React from "react";
import PropTypes from "prop-types";

class LocationSlider extends React.Component {
  render() {
    return (
      <div className="slide-container">
        <h6>Location</h6>
        <input
          type="range"
          min="1"
          max="100"
          defaultValue="50"
          onChange={(e) => this.props.setDetourSearchLocation(e.target.value)}
          className="slider slider-location"
          id="myRange"
        ></input>
      </div>
    );
  }
}

LocationSlider.propTypes = {
  setDetourSearchLocation: PropTypes.func,
};

export default LocationSlider;
