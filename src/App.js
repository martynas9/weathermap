import React, {useEffect, useRef, useState} from 'react';
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

import '@fortawesome/fontawesome-free/css/all.css';

import * as d3 from 'd3';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


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


const HourlyForecastGraph = (props) => {
  const tooltipEl = useRef(null);
  const svgEl = useRef(null);

  const w = 1600,
        h = 480,
        padding = 32;

  useEffect(
    () => {
      if(props.data && svgEl.current) {

        const tooltip = d3.select(tooltipEl.current);

        const svg = d3.select(svgEl.current);

        svg.attr('width', w).attr('height', h);

        const timesArray = props.data.map(value => value.dt*1000);
        //const scaleX = d3.scaleLinear().domain([d3.min(timesArray), d3.max(timesArray)]).range([padding, w-padding]);
        const scaleX = d3.scaleTime().domain([d3.min(timesArray), d3.max(timesArray)]).range([padding+12, w-padding]);
        const axisX = d3.axisBottom(scaleX).ticks(timesArray.length).tickFormat(d3.timeFormat('%H:%M'));
        svg.append('g').attr('transform', `translate(0, ${h-padding})`).attr('id', 'weatherinfo_hourly_graph_svg_axisx').call(axisX);

        const tempsArray = props.data.map(value => Math.round(value.main.temp));
        const scaleY = d3.scaleLinear().domain([d3.min(tempsArray)-1, d3.max(tempsArray)]).range([h-padding, padding]);
        const axisY = d3.axisLeft(scaleY);
        svg.append('g').attr('transform', `translate(${padding}, 0)`).attr('id', 'weatherinfo_hourly_graph_svg_axisy').call(axisY);

        svg.append('text').attr('id', 'weatherinfo_hourly_graph_svg_label').attr('transform', `translate(${padding/4}, ${padding/2})`).html('&#730;C');

        // temperature line: 
        svg
          .selectAll('.templine')
          .data(props.data.slice(0, -1))
          .enter()
          .append('line')
          .attr('class', 'templine')
          .attr('x1', d => scaleX(d.dt*1000))
          .attr('y1', d => scaleY(Math.round(d.main.temp)))
          .attr('x2', (d, i) => scaleX(props.data[i+1].dt*1000))
          .attr('y2', (d, i) => scaleY(Math.round(props.data[i+1].main.temp)));

        // weather icons:
        svg
          .selectAll('image')
          .data(props.data)
          .enter()
          .append('image')
          .attr('x', d => scaleX(d.dt*1000)-16)
          .attr('y', d => scaleY(Math.round(d.main.temp))-32)
          .attr('width', 32)
          .attr('height', 32)
          .attr('xlink:href', d => (`http://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`));

        // temperature points and mouseover tooltips:
        svg
          .selectAll('circle')
          .data(props.data)
          .enter()
          .append('circle')
          .attr('cx', d => scaleX(d.dt*1000))
          .attr('cy', d => scaleY(Math.round(d.main.temp)))
          .attr('r', 5)
          .style('fill', d => (Math.round(d.main.temp) > 0 ? '#dd5555' : '#5566dd'))
          .on('mouseover',
            (d) => {

              const scrollY = document.getElementById('weatherinfo_hourly_graph').scrollLeft;
              const graphDimensions = document.getElementById('weatherinfo_hourly_graph').getBoundingClientRect();
              const tempPosX = scaleX(d.dt*1000)-scrollY;
              const translateX = (tempPosX < graphDimensions.width-120 ? tempPosX+8 : tempPosX-116);
              const tempdate = new Date(d.dt*1000);
              tooltip
              .style('visibility', 'visible')
              .style('transform', `translate(${translateX}px, ${scaleY(Math.round(d.main.temp))-48}px)`)
              .html(`
                ${weekdays[tempdate.getDay()]}, ${tempdate.getHours()}:00
                <br>
                ${Math.round(d.main.temp)}&#730;C <span class="feel">(${Math.round(d.main.feels_like)}&#730;C)</span>
                <br>
                <i class="fas fa-cloud"></i> ${d.clouds.all} %
                <br>
                <img class="wind_icon" src=${process.env.PUBLIC_URL + '/windicon.svg'} alt="wind icon" style="transform: rotate(${d.wind.deg+135}deg)"/> ${d.wind.speed} m/s
              `);
            }
          );

        svg.on('mouseout', () => tooltip.style('visibility', 'hidden'));

      }
    },
    [props.data/*, svgEl.current*/])
  
  return(
    <div>
      <div id="weatherinfo_hourly_graph_tooltip" ref={tooltipEl} />
      <svg id="weatherinfo_hourly_graph_svg" ref={svgEl} />
    </div>
  );
}


const WeatherInfo = (props) => {

  let [hourly, setHourly] = useState(false);
  let [hourlyView, setHourlyView] = useState('list');

  useEffect(() => {
    if(props.weatherinfo) {
      document.getElementById('weatherinfo').scrollIntoView(true);
      setHourly(false);
    }
  }, [props.weatherinfo]);

  useEffect(() => {
    if(hourly) {
      document.getElementById('weatherinfo_hourly').scrollIntoView(true);
    }
  }, [hourly])

  const handleHourlyClick = () => {
    if(props.weatherinfo) {
      const OWKEY = '968464eae7efcc5f8be6d30c8cd46921';
      const callurl = `https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${props.weatherinfo.coord.lat}&lon=${props.weatherinfo.coord.lon}&appid=${OWKEY}`;
      fetch(callurl)
        .then((response) => (response.json()))
        .then((data) => {
          //console.log(data);
          setHourly(data);
        })
        .catch(err => {
          console.log('Weather API call error: ' + err);
        });
    }
  };

  const HourlyForecastData = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if(hourlyView === 'list') {
      return(
        <div id="weatherinfo_hourly_list">
          {hourly.list.map((value, index, array) => {
            let thedate = new Date(parseInt(value.dt)*1000);
            let thelastdate = index > 0 ? new Date(parseInt(array[index-1].dt)*1000) : thedate;
            return (
              <div key={'forecast'+index} >
                {index === 0 || thedate.getDay() !== thelastdate.getDay() ? 
                  <div className="day" >{weekdays[thedate.getDay()] + ', ' + months[thedate.getMonth()] + ' ' + thedate.getDate()}</div>
                : ''}
                <div className="item" >
                  <div className="time">{thedate.getHours() + ':00'}</div>
                  <img className="icon" src={`http://openweathermap.org/img/wn/${value.weather[0].icon}@2x.png`} alt="weather icon" title={value.weather[0].description}/>
                  <div className="temp" title="Temperature / feel">{Math.round(value.main.temp)} &#8451;<br/><span className="feel">{Math.round(value.main.feels_like)} &#8451;</span></div>
                  <div className="desc">{value.weather[0].description}</div>
                  <div className="clouds" title="Cloudiness"><i className="fas fa-cloud" /> {value.clouds.all} %
                  </div>
                  <div className="wind" title="Wind speed">
                    <img className="wind_icon" src={process.env.PUBLIC_URL + '/windicon.svg'} alt="wind icon" style={{transform: `rotate(${value.wind.deg+135}deg)`}}/>
                    {value.wind.speed} m/s
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if(hourlyView === 'graph') {
      return(
        <div id="weatherinfo_hourly_graph">
          <HourlyForecastGraph data={hourly.list} />
        </div>
      );
    } else {
      return('');
    }
  }

  const HourlyForecast = () => {
    if(hourly) {
      return(
        <div id="weatherinfo_hourly">
          <div id="weatherinfo_hourly_view">
            <div id="weatherinfo_hourly_view_list" className={hourlyView === 'list' ? 'selected' : ''} onClick={() => setHourlyView('list')} ><i className="fas fa-bars"></i></div>
            <div id="weatherinfo_hourly_view_graph" className={hourlyView === 'graph' ? 'selected' : ''} onClick={() => setHourlyView('graph')} ><i className="fas fa-chart-bar"></i></div>
          </div>
          <HourlyForecastData />
        </div>
      );
    } else {
      return('');
    }
  };


  if(props.weatherinfo) {
    return(
      <div id="weatherinfo">
        <h2>Weather in {props.weatherinfo.name ? `${props.weatherinfo.name}, ${getCountryName(props.weatherinfo.sys.country)}` : 'your selected location'}</h2>
        <img id="weatherinfo_icon" src={`http://openweathermap.org/img/wn/${props.weatherinfo.weather[0].icon}@2x.png`} alt="weather icon"/>
        <div id="weatherinfo_temp">
          {Math.round(props.weatherinfo.main.temp)}&#8451; <span id="weatherinfo_temp_feel">({Math.round(props.weatherinfo.main.feels_like)}&#8451;)</span>
        </div>
        <div id="weatherinfo_desc">{props.weatherinfo.weather[0].description}</div>
        <div id="weatherinfo_wind">
          <div id="weatherinfo_wind_name">Wind:</div>
          <img id="weatherinfo_windicon" src={process.env.PUBLIC_URL + '/windicon.svg'} alt="wind icon" style={{transform: `rotate(${props.weatherinfo.wind.deg+135}deg)`}}/>
          {props.weatherinfo.wind.speed} m/s
        </div>
        <div id="weatherinfo_cloudiness">
          <div id="weatherinfo_cloudiness_name">Cloudiness:</div>
          {props.weatherinfo.clouds.all} %
        </div>
        <div id="weatherinfo_togglehourly" onClick={handleHourlyClick} className={hourly ? 'nodisplay' : ''}>
          Show hourly forecast
        </div>
        <HourlyForecast />

      </div>
    );
  } else {
    return('');
  }


};



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
    fetch(callurl)
      .then((response) => (response.json()))
      .then((data) => {
      //  console.log(data);
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