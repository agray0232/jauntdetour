import React from "react";
import TripInput from "./components/TripInput.jsx";
import MapContainer from "./components/MapContainer.jsx";
import "./App.css";

function App() {
  return (
    <div className="App">
      <TripInput></TripInput>
      <MapContainer></MapContainer>
    </div>
  );
}

export default App;
