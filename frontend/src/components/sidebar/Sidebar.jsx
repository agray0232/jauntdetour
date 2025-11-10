import React from "react";
import PropTypes from "prop-types";
import UserInput from "./UserInput";
import TripSummary from "./TripSummary";
import DetourForm from "../detour/DetourForm";
import DetourOptionsList from "../detour/DetourOptionsList";

class Sidebar extends React.Component {
  render() {
    return (
      <div className="side-bar">
        <UserInput
          type="desktop"
          origin={this.props.origin}
          destination={this.props.destination}
          setOrigin={this.props.setOrigin}
          setDestination={this.props.setDestination}
          setRoute={this.props.setRoute}
          setTripSummary={this.props.setTripSummary}
          clearAll={this.props.clearAll}
        ></UserInput>
        <TripSummary
          origin={this.props.origin}
          destination={this.props.destination}
          tripSummary={this.props.tripSummary}
          detourList={this.props.detourList}
          removeDetour={this.props.removeDetour}
          setRoute={this.props.setRoute}
          setTripSummary={this.props.setTripSummary}
          setDetourList={this.props.setDetourList}
          showDetourButton={this.props.showDetourButton}
          getDetourForm={this.props.getDetourForm}
          clearAll={this.props.clearAll}
        ></TripSummary>
        {this.props.showDetourForm ? (
          <DetourForm
            setDetourSearchLocation={this.props.setDetourSearchLocation}
            setDetourSearchRadius={this.props.setDetourSearchRadius}
            setDetourType={this.props.setDetourType}
            setDetourOptions={this.props.setDetourOptions}
            setDetourHighlight={this.props.setDetourHighlight}
            detourType={this.props.detourType}
            detourSearchLocation={this.props.detourSearchLocation}
            detourSearchRadius={this.props.detourSearchRadius}
            route={this.props.route}
          ></DetourForm>
        ) : (
          <div></div>
        )}
        {this.props.showDetourOptions ? (
          <DetourOptionsList
            origin={this.props.origin}
            destination={this.props.destination}
            tripSummary={this.props.tripSummary}
            detourOptions={this.props.detourOptions}
            detourList={this.props.detourList}
            detourHighlight={this.props.detourHighlight}
            addDetour={this.props.addDetour}
            setRoute={this.props.setRoute}
            setTripSummary={this.props.setTripSummary}
            setDetourOptions={this.props.setDetourOptions}
            setDetourHighlight={this.props.setDetourHighlight}
            clearDetourOptions={this.props.clearDetourOptions}
          ></DetourOptionsList>
        ) : (
          <div></div>
        )}
      </div>
    );
  }
}

Sidebar.propTypes = {
  origin: PropTypes.object,
  destination: PropTypes.object,
  tripSummary: PropTypes.object,
  detourList: PropTypes.array,
  detourOptions: PropTypes.array,
  detourHighlight: PropTypes.array,
  route: PropTypes.object,
  detourType: PropTypes.string,
  detourSearchLocation: PropTypes.number,
  detourSearchRadius: PropTypes.number,
  showDetourButton: PropTypes.bool,
  showDetourForm: PropTypes.bool,
  showDetourOptions: PropTypes.bool,
  setOrigin: PropTypes.func,
  setDestination: PropTypes.func,
  setRoute: PropTypes.func,
  setTripSummary: PropTypes.func,
  setDetourList: PropTypes.func,
  removeDetour: PropTypes.func,
  getDetourForm: PropTypes.func,
  clearAll: PropTypes.func,
  setDetourSearchLocation: PropTypes.func,
  setDetourSearchRadius: PropTypes.func,
  setDetourType: PropTypes.func,
  setDetourOptions: PropTypes.func,
  setDetourHighlight: PropTypes.func,
  addDetour: PropTypes.func,
  clearDetourOptions: PropTypes.func,
};

export default Sidebar;
