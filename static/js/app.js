// static/js/app.js

// Initialize the map
var map = L.map('map').setView([20, 0], 2); // Initial map view

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Fetch GeoJSON data from Flask backend
fetch('/countries')
  .then((response) => response.json())
  .then((geojson) => {
    L.geoJSON(geojson, {
      style: styleCountries,
      onEachFeature: onEachFeature,
    }).addTo(map);
  })
  .catch((error) => {
    console.error('Error fetching GeoJSON data:', error);
  });

// Style for the countries
function styleCountries(feature) {
  return {
    color: '#3388ff',
    weight: 1,
    fillOpacity: 0.2,
  };
}

// Event handlers for each country feature
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: countryClicked,
  });
}

// Highlight feature on mouseover
function highlightFeature(e) {
  var layer = e.target;
  layer.setStyle({
    weight: 2,
    color: '#666',
    fillOpacity: 0.7,
  });

  var countryName = layer.feature.properties.name;
  var countryCode = layer.feature.id; // ISO 3166-1 alpha-2 code
  var flagUrl = `https://flagcdn.com/64x48/${countryCode.toLowerCase()}.png`;

  layer.bindTooltip(
    `<img src="${flagUrl}" alt="Flag of ${countryName}" width="30"><br>${countryName}`,
    { permanent: false, direction: 'top' }
  ).openTooltip();
}

// Reset highlight on mouseout
function resetHighlight(e) {
  var layer = e.target;
  layer.setStyle({
    weight: 1,
    color: '#3388ff',
    fillOpacity: 0.2,
  });
  layer.closeTooltip();
}

// Handle country click event
function countryClicked(e) {
  var layer = e.target;
  var countryName = layer.feature.properties.name;

  // Fetch weather data from Flask backend
  fetch(`/weather?country=${encodeURIComponent(countryName)}`)
    .then((response) => response.json())
    .then((weatherData) => {
      displayWeatherInfo(weatherData);
    })
    .catch((error) => {
      console.error('Error fetching weather data:', error);
    });
}

// Show the sidebar
function showSidebar() {
  document.getElementById('sidebar').style.display = 'block';
}

// Hide the sidebar
function hideSidebar() {
  document.getElementById('sidebar').style.display = 'none';
}

// Display weather information in the sidebar using Bootstrap card
function displayWeatherInfo(weatherData) {
  if (weatherData.error) {
    document.getElementById('sidebar').innerHTML = `<p>${weatherData.error}</p>`;
    return;
  }

  // Extract necessary data
  const cityName = weatherData.name;
  const temperature = weatherData.main.temp;
  const weatherDescription = weatherData.weather[0].description;
  const windSpeed = weatherData.wind.speed;
  const humidity = weatherData.main.humidity;
  const iconCode = weatherData.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // Get the current time
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="card text-body" style="border-radius: 15px; margin-top: 20px;">
      <div class="card-body p-4">

        <div class="d-flex justify-content-between">
          <h5 class="flex-grow-1">${cityName}</h5>
          <h5>${currentTime}</h5>
        </div>

        <div class="d-flex flex-column text-center mt-5 mb-4">
          <h6 class="display-4 mb-0 font-weight-bold">${temperature}°C</h6>
          <span class="small" style="color: #868B94">${weatherDescription}</span>
        </div>

        <div class="d-flex align-items-center">
          <div class="flex-grow-1" style="font-size: 1rem;">
            <div><i class="fas fa-wind fa-fw" style="color: #868B94;"></i> <span class="ms-1"> ${windSpeed} m/s</span></div>
            <div><i class="fas fa-tint fa-fw" style="color: #868B94;"></i> <span class="ms-1"> ${humidity}%</span></div>
          </div>
          <div>
            <img src="${iconUrl}" alt="Weather icon" width="100px">
          </div>
        </div>

      </div>
    </div>
  `;

  // Ensure the sidebar is displayed
  showSidebar();
}

// Implement search functionality with autocomplete
$(function () {
  var countries = [];

  // Fetch country names from the backend
  fetch('/country_names')
    .then((response) => response.json())
    .then((data) => {
      countries = data;
      $('#countrySearch').autocomplete({
        source: countries,
        select: function (event, ui) {
          // When a country is selected, zoom to it
          zoomToCountry(ui.item.value);
        },
      });
    });
});

// Zoom to the selected country
function zoomToCountry(countryName) {
  // Fetch country data from Flask backend
  fetch(`/search_country?country=${encodeURIComponent(countryName)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.latlng) {
        var latlng = data.latlng;
        map.setView([latlng[0], latlng[1]], 5);
        // Fetch weather data for the selected country
        fetch(`/weather?country=${encodeURIComponent(data.name)}`)
          .then((response) => response.json())
          .then((weatherData) => {
            displayWeatherInfo(weatherData);
          });
      } else {
        alert('Country not found!');
      }
    })
    .catch((error) => {
      console.error('Error fetching country data:', error);
    });
}

// Event listener for the search input
document.getElementById('countrySearch').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    var countryName = event.target.value;
    zoomToCountry(countryName);
  }
});
