import React from 'react';
import './App.css';
import getCountryName from './countries.js';

import 'ol/ol.css';
import {Map, View} from 'ol';
import Feature from 'ol/Feature';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import Point from 'ol/geom/Point';
import {fromLonLat, toLonLat} from 'ol/proj';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';



class TopBar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      inputtext: '',
      searchresult: {}
    };
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
  }

  handleSearchChange(event) {
    this.setState({inputtext: event.target.value});
    //https://photon.komoot.de/api/?q=viln&limit=2
    const div_suggestion = document.getElementById('topbar_input_suggestion');
    if(event.target.value.length >= 3) {
      fetch(`https://photon.komoot.de/api/?q=${event.target.value}&limit=1`)
        .then(response => response.json())
        .then(data => {
          console.log(data);
          if(data.features.length === 0) {
            div_suggestion.style.visibility = 'hidden';
            this.setState({searchresult: {}});
          } else {
            div_suggestion.style.visibility = 'visible';
            const location_name = `${data.features[0].properties.name}, ${data.features[0].properties.country}`;
            div_suggestion.innerHTML = location_name;
            this.setState({searchresult: {
              name: location_name,
              coord_lon: data.features[0].geometry.coordinates[1],
              coord_lat: data.features[0].geometry.coordinates[0]
            }});
          }
        });
    } else {
      div_suggestion.style.visibility = 'hidden';
      this.setState({searchresult: {}});
      console.log(this.state.searchresult);
    }
  }

  handleSuggestionClick(event) {
    if(Object.keys(this.state.searchresult).length > 0) {
      this.setState(state => ({inputtext: state.searchresult.name}));
      document.getElementById('topbar_input_suggestion').style.visibility = 'hidden';
      console.log('set coordinates in map, search for weather');
    }
  }

  render() {
    return (
      <div id="topbar">
        <h1>weathermap</h1>
        <input id="topbar_input" type="text" maxLength="64" placeholder="Enter location name..." onChange={this.handleSearchChange} value={this.state.inputtext}/>
        <div id="topbar_input_suggestion" onClick={this.handleSuggestionClick} />
      </div>
    );
  }

}


class OlMap extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      mapobj: false,
      vectorlayerobj: false,
    }
    this.initOlMap = this.initOlMap.bind(this);
  }

  componentDidMount() {
    this.initOlMap();
  }

  initOlMap() {
    const viewobj = new View({
      center: fromLonLat([15.2551, 54.5260]),
      zoom: 4,
      maxZoom: 12,
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

    // create position circle img:
    const positionFeature = new Feature();
      positionFeature.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({
            color: '#3399CC'
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2
          })
        })
      }));

    // create vector layer for images:
    const vectorlayerobj = new VectorLayer({
      map: mapobj,
      source: new VectorSource({
        features: [positionFeature]
      })
    });

    // show position on map:
    navigator.geolocation.getCurrentPosition((pos) => {
      viewobj.setCenter(fromLonLat([pos.coords.longitude, pos.coords.latitude]));
      viewobj.setZoom(7);
      positionFeature.setGeometry(
        new Point(fromLonLat([pos.coords.longitude, pos.coords.latitude]))
      );
    });


    this.setState({
      mapobj: mapobj,
      vectorlayerobj: vectorlayerobj
    });

    // show weather on selected location when single clicking on the map:
    mapobj.on('singleclick', 
      (event) => {
        const lonlat = toLonLat(event.coordinate);
        const owkey = '968464eae7efcc5f8be6d30c8cd46921';
        const callurl = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lonlat[1]}&lon=${lonlat[0]}&appid=${owkey}`;
        fetch(callurl)
          .then((response) => (response.json()))
          .then((data) => {
            //console.log(data);
            this.props.f_changeWeatherInfo(data);
          })
          .catch(err => {
            console.log('Weather API call error: ' + err);
          });

      }
    );
  }

  render() {
    return(
      <div id="olmap" />
    );
  }

}


class WeatherInfo extends React.Component {

  componentDidUpdate() {
    if(this.props.weatherinfo) {
      document.getElementById('weatherinfo').scrollIntoView(true);
    }
  }
/*
  getWeatherIcon = (weathername) => {
    // https://www.iconfinder.com/iconsets/weather-color-2
    // process.env.PUBLIC_URL
    const icons = {
      Clear: ''
    }
  }
*/
  render() {

    if(this.props.weatherinfo) {
      return(
        <div id="weatherinfo">
          <h2>Weather in {this.props.weatherinfo.name ? `${this.props.weatherinfo.name}, ${getCountryName(this.props.weatherinfo.sys.country)}` : 'your selected location'}</h2>
          <img id="weatherinfo_icon" src={`http://openweathermap.org/img/wn/${this.props.weatherinfo.weather[0].icon}@2x.png`} alt="weather icon"/>
          <div id="weatherinfo_temp">
            {Math.round(this.props.weatherinfo.main.temp)}&#8451; <span id="weatherinfo_temp_feel">({Math.round(this.props.weatherinfo.main.feels_like)}&#8451;)</span>
          </div>
          <div id="weatherinfo_desc">{this.props.weatherinfo.weather[0].description}</div>
          <div id="weatherinfo_wind">
            <div id="weatherinfo_wind_name">Wind:</div>
            <img id="weatherinfo_windicon" src={process.env.PUBLIC_URL + '/windicon.svg'} alt="wind icon" style={{transform: `rotate(${this.props.weatherinfo.wind.deg+135}deg)`}}/>
            {this.props.weatherinfo.wind.speed} m/s
          </div>
          <div id="weatherinfo_cloudiness">
            <div id="weatherinfo_cloudiness_name">Cloudiness:</div>
            {this.props.weatherinfo.clouds.all} %
            </div>

        </div>
      );
    } else {
      return('');
    }
  }

}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      weatherinfo: false
    };
    this.changeWeatherInfo = this.changeWeatherInfo.bind(this);
  }

  changeWeatherInfo(data) {
    this.setState({weatherinfo: data});
  }

  render() {
    return(
      <div>
        <TopBar f_changeWeatherInfo={this.changeWeatherInfo} />
        <OlMap f_changeWeatherInfo={this.changeWeatherInfo}/>
        <WeatherInfo weatherinfo={this.state.weatherinfo}/>
      </div>
    );
  }

}


export default App;

/*
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAQI33ueJEn8G4W7NQEjR_R30R9gtAy69M&libraries=places&callback=initMap"
    type="text/javascript"></script>
*/