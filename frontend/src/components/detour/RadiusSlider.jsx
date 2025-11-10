import React from "react";
import PropTypes from "prop-types";

class RadiusSlider extends React.Component {
  render() {
    return (
      <div className="slidecontainer">
        <h6>Radius</h6>
        <input
          type="range"
          min="1"
          max="100000"
          defaultValue="20000"
          onChange={(e) => this.props.setDetourSearchRadius(e.target.value)}
          className="slider"
          id="detourRadius"
        ></input>
      </div>
    );
  }
}

RadiusSlider.propTypes = {
  setDetourSearchRadius: PropTypes.func,
};

export default RadiusSlider;
