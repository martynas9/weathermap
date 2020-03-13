import React from 'react';
import './App.css';

class TopBar extends React.Component {

  render() {
    return (
      <div id="topbar">
        <h1>weathermap</h1>
        <input id="topbar_input" placeholder="Enter location name..."/>
      </div>
    );
  }

}


class TheMap extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      mapobject: false
    };
  }

  componentDidMount() {
    this.loadGoogleMapsAPI();
  }

  loadGoogleMapsAPI = () => {
    const index = document.getElementsByTagName('script')[0];
    let script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAQI33ueJEn8G4W7NQEjR_R30R9gtAy69M&callback=initMap';
    script.async = true;
    script.defer = true;
    index.parentNode.insertBefore(script, index);
    window.initMap = this.initMap;
  }

  initMap = () => {
    this.setState({mapobject: new window.google.maps.Map(document.getElementById('map'), {
      center: {lat: -34.397, lng: 150.644},
      zoom: 8
    })});
    /*
    map.center = {lat: -34.397, lng: 150.644};
    map.zoom = 8;*/

  }

  render() {
    return (
      <div id="map" />
    );
  }
}

class WeatherInfo extends React.Component {

  render() {
    return(
      <div id="weatherinfo">
        <h2>Weather in CITY_NAME</h2>
      </div>
    );
  }

}

class App extends React.Component {

  render() {
    return(
      <div>
        <TopBar />
        <TheMap />
        <WeatherInfo />
      </div>
    );
  }

}


export default App;

/*
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAQI33ueJEn8G4W7NQEjR_R30R9gtAy69M&callback=initMap"
    type="text/javascript"></script>
*/