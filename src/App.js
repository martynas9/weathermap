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
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';



class TopBar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      inputtext: '',
      searchresult: {}
    };
    this.handleSearchFocus = this.handleSearchFocus.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
    this.doSearch = this.doSearch.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', (event) => {
      if(document.getElementById('topbar_input') === document.activeElement) { // if focus is on search input
        if(event.keyCode === 40) { // if press arrow_d
          if(this.state.inputtext.length >= 3 && Object.keys(this.state.searchresult).length > 0) {
            this.setState(state => ({inputtext: state.searchresult.name}));
          }
        } else if(event.keyCode === 13) { // press enter
          if(this.state.inputtext.length >= 3 && this.state.inputtext === this.state.searchresult.name) {
            document.activeElement.blur();
            this.handleSuggestionClick();
          }
        }
      }
    });
  }

  handleSearchFocus(event) {
    if(Object.keys(this.state.searchresult).length > 0) {
      if(this.state.searchresult.name === this.state.inputtext) {
        this.setState({inputtext: '', searchresult: {}});
        document.getElementById('topbar_input_suggestion').style.visibility = 'hidden';
      }
    }
  }


  doSearch(value) {
    if(value === this.state.inputtext) { // if value didnt change in 500ms
      const div_suggestion = document.getElementById('topbar_input_suggestion');
      fetch(`https://photon.komoot.de/api/?q=${value}&limit=1`)
        .then(response => response.json())
        .then(data => {
          if(data.features.length === 0) {
            div_suggestion.style.visibility = 'hidden';
            this.setState({searchresult: {}});
          } else {
            //console.log(data.features[0]);
            div_suggestion.style.visibility = 'visible';
            const location_name = `${data.features[0].properties.name}, ${data.features[0].properties.country}`;
            div_suggestion.innerHTML = location_name;
            this.setState({searchresult: {
              name: location_name,
              lon: data.features[0].geometry.coordinates[0],
              lat: data.features[0].geometry.coordinates[1]
            }});
          }
        });
    }
  }


  handleSearchChange(event) {
    this.setState({inputtext: event.target.value});
    if(event.target.value.length >= 3) {
      setTimeout(this.doSearch, 500, event.target.value);
    } else {
      document.getElementById('topbar_input_suggestion').style.visibility = 'hidden';
      this.setState({searchresult: {}});
    }
  }

  handleSuggestionClick() {
    if(Object.keys(this.state.searchresult).length > 0) {
      this.setState(state => ({inputtext: state.searchresult.name}));
      document.getElementById('topbar_input_suggestion').style.visibility = 'hidden';
      this.props.f_requestOpenWeatherInfo(this.state.searchresult.lon, this.state.searchresult.lat); // requesting for weather
      this.props.f_setMarkerPosition(this.state.searchresult.lon, this.state.searchresult.lat, true); // setting position on map
    }
  }

  render() {
    return (
      <div id="topbar">
        <h1>weathermap</h1>
        <input id="topbar_input" type="text" maxLength="64" placeholder="Enter location name..." onFocus={this.handleSearchFocus} onChange={this.handleSearchChange} value={this.state.inputtext}/>
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
      markerfeature: false,
      vectorlayerobj: false
    }
    this.initOlMap = this.initOlMap.bind(this);
  }

  componentDidMount() {
    this.initOlMap();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(typeof(this.state.markerfeature) === 'object' && typeof(this.props.markerposition) === 'object') {
      if((typeof(prevProps.markerposition) === 'object' && prevProps.markerposition.lon !== this.props.markerposition.lon) || prevProps.markerposition === false) { // update only if needed
        this.state.markerfeature.setGeometry(
          new Point(fromLonLat([this.props.markerposition.lon, this.props.markerposition.lat]))
        );
        if(this.props.markerposition.zoom === true && typeof(this.state.viewobj) === 'object') {
          this.state.viewobj.setCenter(fromLonLat([this.props.markerposition.lon, this.props.markerposition.lat]));
          if(this.state.viewobj.getZoom() < 8) {
            this.state.viewobj.setZoom(8);
          }
        }
      }
    }
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
          color: '#2266AA'
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 2
        })
      })
    }));

    // create map pointer img: https://www.iconfinder.com/icons/1814106/location_map_marker_icon
    // {process.env.PUBLIC_URL + '/markericon.svg'}
    const markerFeature = new Feature();
    markerFeature.setStyle(new Style({
      image: new Icon({
        src: process.env.PUBLIC_URL + '/markericon.png',
        anchor: [0.5, 0.9],
        scale: 0.5
      })
    }));

    // create vector layer for images:
    const vectorlayerobj = new VectorLayer({
      map: mapobj,
      source: new VectorSource({
        features: [positionFeature, markerFeature]
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
      viewobj: viewobj,
      markerfeature: markerFeature,
      vectorlayerobj: vectorlayerobj
    });

    // show weather on selected location when single clicking on the map:
    mapobj.on('singleclick', 
      (event) => {
        const lonlat = toLonLat(event.coordinate);
        this.props.f_requestOpenWeatherInfo(lonlat[0], lonlat[1]);
        this.props.f_setMarkerPosition(lonlat[0], lonlat[1], false);
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



class ScrollUp extends React.Component {

  constructor(props) {
    super(props);
    this.handleScrollUpClick = this.handleScrollUpClick.bind(this);
  }

  componentDidMount() {
    window.addEventListener('scroll', (event) => {
      const topbar = document.getElementById('topbar');
      if(topbar) {
        if(window.scrollY > topbar.clientHeight) {
          document.getElementById('scrollup').style.visibility = 'visible';
        } else {
          document.getElementById('scrollup').style.visibility = 'hidden';
        }
      }
    });
  }

  handleScrollUpClick(event) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render() {
    return(
      <div id="scrollup_wrapper">
        <div id="scrollup" onClick={this.handleScrollUpClick}>Back to top</div>
      </div>
    );
  }
}


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      weatherinfo: false,
      markerposition: false,
    };
    this.requestOpenWeatherInfo = this.requestOpenWeatherInfo.bind(this);
    this.setMarkerPosition = this.setMarkerPosition.bind(this);
  }

  requestOpenWeatherInfo(lon, lat) {
    const OWKEY = '968464eae7efcc5f8be6d30c8cd46921';
    const callurl = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${OWKEY}`;
    //const callurl = `https://api.openweathermap.org/data/2.5/onecall?units=metric&lat=${lat}&lon=${lon}&appid=${OWKEY}`;
    fetch(callurl)
      .then((response) => (response.json()))
      .then((data) => {
        console.log(data);
        this.setState({weatherinfo: data});
      })
      .catch(err => {
        console.log('Weather API call error: ' + err);
      });
  }

  setMarkerPosition(lon, lat, zoom = false) {
    //console.log(lon, lat, zoom);
    this.setState({markerposition: {
      lon: lon,
      lat: lat,
      zoom: zoom
    }});
  }

  render() {
    return(
      <div>
        <TopBar f_requestOpenWeatherInfo={this.requestOpenWeatherInfo} f_setMarkerPosition={this.setMarkerPosition} />
        <OlMap f_requestOpenWeatherInfo={this.requestOpenWeatherInfo} f_setMarkerPosition={this.setMarkerPosition} markerposition={this.state.markerposition}/>
        <WeatherInfo weatherinfo={this.state.weatherinfo}/>
        <ScrollUp />
      </div>
    );
  }

}


export default App;