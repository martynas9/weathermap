import React from 'react';
import './App.css';
import {compose, withProps} from 'recompose';
import {withScriptjs, withGoogleMap, GoogleMap, Marker} from 'react-google-maps';

class SearchBar extends React.Component {

  render() {
    return (
      <div id="searchbar">
        <input id="searchbar_input"/>
      </div>
    );
  }

}

const MapComponent = compose(
  withProps({
    googleMapURL: 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places',
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `300px`, minHeight: `80vh` }} />,
    mapElement: <div style={{ height: `100%` }} /> 
  }),
  withScriptjs,
  withGoogleMap
)((props) => (
  <GoogleMap defaultZoom={8} defaultCenter={{ lat: -34.397, lng: 150.644 }}>
     {props.isMarkerShown && <Marker position={{ lat: -34.397, lng: 150.644 }} />}
  </GoogleMap>
));

class App extends React.Component {
/*
  constructor(props) {
    super(props);
  }
*/
  render() {
    return(
      <div>
        <SearchBar />
        <MapComponent isMarkerShown />
      </div>
    );
  }

}

export default App;
