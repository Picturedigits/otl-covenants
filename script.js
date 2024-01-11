// Edit the center point and zoom level
var map = L.map('map', {
  center: [41.7676, -72.6296],
  zoom: 11,
  scrollWheelZoom: false
});
// create custom pane for town layer, set below overlay zIndex 400, make non-clickable
map.createPane('towns');
map.getPane('towns').style.zIndex = 350;
map.getPane('towns').style.pointerEvents = 'none';

// Add Carto basemap
new L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);


// Add Esri geocoder
var searchControl = L.esri.Geocoding.geosearch().addTo(map);

var results = L.layerGroup().addTo(map);

searchControl.on('results', function (data) {
  results.clearLayers();
  for (var i = data.results.length - 1; i >= 0; i--) {
    results.addLayer(L.marker(data.results[i].latlng));
  }
});

// Add scale control
L.control.scale().addTo(map);

// Prepend attribution to "Powered by Esri"
map.attributionControl.setPrefix('View\
  <a href="https://github.com/ontheline/otl-covenants" target="_blank">sources and code on GitHub</a>,\
  created with ' + map.attributionControl.options.prefix);

// town outline layer, with custom pane set to lower non-clickable layer
$.getJSON("src/ct-towns-simple.geojson", function (data) {
  var geoJsonLayer = L.geoJson(data, {
    style: function (feature) {
      return {
        'color': 'red',
        'weight': 2,
        fillOpacity: 0
      }
    },
    pane: 'towns'
  }).addTo(map);
});


/************** ADD SIDEBAR AS CONTROL ***************/
L.Control.Sidebar = L.Control.extend({
  onAdd: function(map) {
    // Create a main div container and disable clickthrough
    var div = L.DomUtil.create('div', 'sidebar');
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    div.innerHTML = '<div id="toggle-sidebar">&harr;</div>';
    return div;
  },

  options: {
    position: 'topright'
  },

  onRemove: function(map) {}
});


L.control.sidebar = function(opts) {
  return new L.Control.Sidebar(opts);
}

L.control.sidebar().addTo(map);
/****************************************/



// restrictive covenants layer on top
$.getJSON("map.geojson", function (data) {

  var devs = [];

  geoJsonLayer = L.geoJson(data, {
    style: style,
    onEachFeature: function( feature, layer) {
      var popupText = "<b>" + feature.properties.longname + "</b><br />"
         + "&quot;" + feature.properties.text + "&quot; -- " + feature.properties.date + "<br />"
         + "<a href='https://ontheline.github.io/otl-covenants/pdf/" + feature.properties.id + ".pdf' target='_blank'>View property deed (PDF opens new tab)</a>";
      layer.bindPopup(popupText);

      devs.push([feature, layer]);
    }
  }).addTo(map);


  populateSidebar(devs);

});


function populateSidebar(devs) {

  // Sort developments by town, alphabetically
  devs.sort(function(a, b) { return a[0].properties.town > b[0].properties.town ? 1 : -1 });

  
  townsAdded = []; // Keep track of town names we already added to the sidebar as a title
  layers = {};  // Use this object to retrieve geojson layers by layer ID, ie {id1:layer, id2:layer2}

  for (var i = 0; i < devs.length; i++) {
    var feature = devs[i][0];
    var town = feature.properties.town;

    // Get a leaflet layer for the town
    var layer = devs[i][1];
    layers[feature.properties.id] = layer;
    

    // Add town to sidebar if needed
    if (townsAdded.indexOf(town) < 0) {
      townsAdded.push(town);
      $('.sidebar').append('<h3>' + town + '</h3>');
    }

    // Add development name with link
    $('.sidebar').append('<h4 id="' + feature.properties.id + '">' + feature.properties.longname + '</h4>');

  }

  $('.sidebar h4').click(function() {
    var clickedId = $(this).prop('id');
    map.fitBounds( layers[clickedId].getBounds() );
    layers[clickedId].openPopup();
  })

  $('#toggle-sidebar').click(function() {
    var currentHeight = $('.sidebar').css('height');
    $('.sidebar').css('height', currentHeight === '200px' ? '50px' : '200px');
  })

}

function style(feature) {
  return {
    fillColor: 'purple',
    weight: 1,
    opacity: 1,
    color: 'black',
    fillOpacity: 0.7
  };
}

// places a star on state capital of Hartford, CT
var starIcon = L.icon({
  iconUrl: 'src/star-18.png',
  iconRetinaUrl: 'src/star-18@2x.png',
  iconSize: [18, 18]
});
L.marker([41.7646, -72.6823], {icon: starIcon}).addTo(map);