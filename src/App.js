import React from 'react';
import './App.css';

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
    //this.state.acobj.setFields(['address_component']);

    // When the user selects an address from the drop-down, populate the
    // address fields in the form.
    //this.state.acobj.addListener('place_changed', this.fillInAddress);

  }
  

  fillInAddress = () => {
    /*
    // Get the place details from the autocomplete object.
    var place = this.state.acobj.getPlace();
  
    for (var component in this.state.componentForm) {
      document.getElementById(component).value = '';
      document.getElementById(component).disabled = false;
    }
  
    // Get each component of the address from the place details,
    // and then fill-in the corresponding field on the form.
    for (var i = 0; i < place.address_components.length; i++) {
      var addressType = place.address_components[i].types[0];
      if (this.state.componentForm[addressType]) {
        var val = place.address_components[i][this.state.componentForm[addressType]];
        document.getElementById(addressType).value = val;
      }
    }
    */
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
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAQI33ueJEn8G4W7NQEjR_R30R9gtAy69M&libraries=places&callback=initMap"
    type="text/javascript"></script>
*/