import React from "react";
import Header from "./header/Header";
import FooterMenu from "./footer-menu/FooterMenu";
import MapContainer from "./MapContainer_new";
import Sidebar from "./sidebar/Sidebar";
import Button from "./Button";

class Main extends React.Component {
  render() {
    return (
      <div className="app-container">
        <Header
          origin={this.props.origin}
          destination={this.props.destination}
          setOrigin={this.props.setOrigin}
          setDestination={this.props.setDestination}
          setRoute={this.props.setRoute}
          setTripSummary={this.props.setTripSummary}
          clearAll={this.props.clearAll}
        ></Header>
        <Sidebar
          origin={this.props.origin}
          destination={this.props.destination}
          tripSummary={this.props.tripSummary}
          setOrigin={this.props.setOrigin}
          setDestination={this.props.setDestination}
          setRoute={this.props.setRoute}
          setDetourType={this.props.setDetourType}
          setTripSummary={this.props.setTripSummary}
          setDetourSearchLocation={this.props.setDetourSearchLocation}
          setDetourSearchRadius={this.props.setDetourSearchRadius}
          setDetourOptions={this.props.setDetourOptions}
          setDetourHighlight={this.props.setDetourHighlight}
          setDetourList={this.props.setDetourList}
          detourType={this.props.detourType}
          detourSearchLocation={this.props.detourSearchLocation}
          detourSearchRadius={this.props.detourSearchRadius}
          addDetour={this.props.addDetour}
          removeDetour={this.props.removeDetour}
          detourList={this.props.detourList}
          route={this.props.route}
          showDetourButton={this.props.showDetourButton}
          showDetourForm={this.props.showDetourForm}
          showDetourOptions={this.props.showDetourOptions}
          getDetourForm={this.props.getDetourForm}
          detourOptions={this.props.detourOptions}
          detourHighlight={this.props.detourHighlight}
          clearDetourOptions={this.props.clearDetourOptions}
          clearAll={this.props.clearAll}
        ></Sidebar>
        <div className="map-container">
          <MapContainer
            showRoute={this.props.showRoute}
            showDetourSearchPoint={this.props.showDetourSearchPoint}
            detourSearchLocation={this.props.detourSearchLocation}
            detourSearchRadius={this.props.detourSearchRadius}
            detourOptions={this.props.detourOptions}
            detourHighlight={this.props.detourHighlight}
            detourList={this.props.detourList}
            route={this.props.route}
          ></MapContainer>
        </div>
        <FooterMenu
          origin={this.props.origin}
          destination={this.props.destination}
          tripSummary={this.props.tripSummary}
          detourList={this.props.detourList}
          removeDetour={this.props.removeDetour}
          addDetour={this.props.addDetour}
          setRoute={this.props.setRoute}
          setTripSummary={this.props.setTripSummary}
          setDetourList={this.props.setDetourList}
          showDetourButton={this.props.showDetourButton}
          showDetourForm={this.props.showDetourForm}
          showDetourOptions={this.props.showDetourOptions}
          getDetourForm={this.props.getDetourForm}
          setDetourSearchLocation={this.props.setDetourSearchLocation}
          setDetourSearchRadius={this.props.setDetourSearchRadius}
          setDetourType={this.props.setDetourType}
          setDetourOptions={this.props.setDetourOptions}
          setDetourHighlight={this.props.setDetourHighlight}
          detourType={this.props.detourType}
          detourSearchLocation={this.props.detourSearchLocation}
          detourSearchRadius={this.props.detourSearchRadius}
          detourOptions={this.props.detourOptions}
          detourHighlight={this.props.detourHighlight}
          route={this.props.route}
          clearAll={this.props.clearAll}
          clearDetourOptions={this.props.clearDetourOptions}
        ></FooterMenu>
      </div>
    );
  }
}

export default Main;
