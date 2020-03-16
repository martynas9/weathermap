import React from 'react';
import './App.css';

import 'ol/ol.css';
import {Map, View} from 'ol';
import Feature from 'ol/Feature';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import Point from 'ol/geom/Point';
import {fromLonLat} from 'ol/proj';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

class TopBar extends React.Component {

  render() {
    return (
      <div id="topbar">
        <h1>weathermap</h1>
        <input id="topbar_input" type="text" placeholder="Enter location name..." autocomplete="on"/>
      </div>
    );
  }

}

/*
class TheMap extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      mapobj: false,
      acobj: false,
    };
  }

  componentDidMount() {
    this.loadGoogleMapsAPI();
  }

  loadGoogleMapsAPI = () => {
    const index = document.getElementsByTagName('script')[0];
    let script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAQI33ueJEn8G4W7NQEjR_R30R9gtAy69M&libraries=places&callback=initMap';
    script.async = true;
    script.defer = true;
    index.parentNode.insertBefore(script, index);
    window.initMap = this.initMap;
  }

  initMap = () => {
    this.setState({
      mapobj: new window.google.maps.Map(
        document.getElementById('map'),
        {
          center: {lat: 54.687, lng: 25.280},
          zoom: 5
        }
      ),
      acobj: new window.google.maps.places.Autocomplete(
        document.getElementById('topbar_input'),
        {
          types: ['geocode']
        }
      )
    });

    navigator.geolocation.getCurrentPosition((pos) => {
      this.state.mapobj.setCenter({lat: pos.coords.latitude, lng: pos.coords.longitude});
    });


    // Avoid paying for data that you don't need by restricting the set of
    // place fields that are returned to just the address components.
    this.state.acobj.setFields(['address_component']);

    // When the user selects an address from the drop-down, populate the
    // address fields in the form.
    this.state.acobj.addListener('place_changed', this.showWeatherInfo);

  }
  

  showWeatherInfo = () => {

  }

  
  geolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        var circle = new window.google.maps.Circle(
            {center: geolocation, radius: position.coords.accuracy});
        this.state.acobj.setBounds(circle.getBounds());
      });
    }
  }
  
  

  render() {
    return (
      <div id="map" />
    );
  }
}
*/

class OlMap extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      mapobj: false,
      vectorlayerobj: false,
    }
  }

  componentDidMount() {
    this.initOlMap();
  }

  initOlMap = () => {
    const viewobj = new View({
      center: fromLonLat([15.2551, 54.5260]),
      zoom: 4
    });

    const mapobj = new Map({
      target: 'olmap',
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: viewobj
    });

    const positionFeature = new Feature();
      positionFeature.setStyle(new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#3399CC'
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2
          })
        })
      }));

    const vectorlayerobj = new VectorLayer({
      map: mapobj,
      source: new VectorSource({
        features: [positionFeature]
      })
    });

    navigator.geolocation.getCurrentPosition((pos) => {
      viewobj.setCenter(fromLonLat([pos.coords.longitude, pos.coords.latitude]));


      positionFeature.setGeometry(
        new Point(fromLonLat([pos.coords.longitude, pos.coords.latitude]))
      );

    });


    this.setState({
      mapobj: mapobj,
      vectorlayerobj: vectorlayerobj
    });

    mapobj.on('dblclick', 
      (event) => {
        console.log(event.coordinate);
      }
    );
  };

  render() {
    return(
      <div id="olmap" />
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
        <OlMap />
        <WeatherInfo />
      </div>
    );
  }

}


export default App;

/*
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAQI33ueJEn8G4W7NQEjR_R30R9gtAy69M&libraries=places&callback=initMap"
    type="text/javascript"></script>
*/