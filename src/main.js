// import CSS
import './style.css';
import 'ol/ol.css';

// Import OpenLayers
// OpenLayers classes
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation.js';
// OpenLayers formats
import GeoJSON from 'ol/format/GeoJSON';
// OpenLayers geometries
import Point from 'ol/geom/Point';
// OpenLayers layers
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
// OpenLayers styles
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
// OpenLayers sources
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
// OpenLayers controls
import {Attribution, defaults as defaultControls} from 'ol/control.js';

// Define extent
const extent = [5852008.3243, 92896.8792, 5846640.1080, 99813.8944];

// Define a new OSM tile layer
const OSMLayer = new TileLayer({
  source: new OSM({ transition: 0 }), // Use OpenStreetMap as the tile source,
  className: 'ol-osm'
});

// Define a new vector source and vector layer with the content of the assets/merged.geojson file
const vectorSource = new VectorSource({
  url: import.meta.env.BASE_URL + 'merged.geojson',
  format: new GeoJSON({ transition: 0 }),
  attributions: '© <a href="https://www.epfl.ch/schools/cdh/time-machine-unit/" target="_blank">EPFL Time Machine Unit</a>'
})

// Define a style function to style the feature in the VectorLayer
const styleFunction = function (feature) {
  // Use a switch to define the styling to apply to each feature depending on its 'class' property
  let classValue = feature.get('class');
  switch (classValue) {
    case 'road_network':
      return new Style({
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0)',
        }),
        stroke: new Stroke({
          width: 0,
        }),
      });
    case 'built':
      return new Style({
        fill: new Fill({
          color: '#eecbaf',
        }),
        stroke: new Stroke({
          color: '#596559',
          width: 1,
        }),
      });
    case 'non-built':
      return new Style({
        fill: new Fill({
          color: '#9bbe79',
        }),
        stroke: new Stroke({
          color: '#232323',
          width: 1,
        }),
      });
    case 'water':
      return new Style({
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0)',
          // color: '#9ecfe5',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0)',
          width: 1,
        }),
      });
    default:
      return new Style({
        fill: new Fill({
          color: 'white', // Default color if class is not matched
        })
      });
  }
};

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: styleFunction,
  opacity: 0.5,
});

// Define a new tile source from the tiles folder
const tileSource = new XYZ({
  url: 'https://geo-timemachine.epfl.ch/geoserver/www/tilesets/montmorillon-1840/{z}/{x}/{y}.png',
  minZoom: 11,
  maxZoom: 21,
  extent: extent,
  transition: 0,
  attributions: '© <a href="https://archives-deux-sevres-vienne.fr/ark:/28387/vtac12d0108cfa39369" target="_blank">Archives dépertementales des Deux-Sèvres et Vienne</a>'
});

tileSource.on('tileloadstart', function (e) {
});

tileSource.on(['tileloadend', 'tileloaderror'], function (e) {
});

const tileLayer = new TileLayer({
  preload: Infinity,
  source: tileSource
});

const view = new View({
  center: [5852008.3243, 92896.8792],
  zoom: 12
});

// Create a new attribution control
const attribution = new Attribution({
  collapsible: true,
  collapsed: true,
});

// Create a map instance
const map = new Map({
  target: 'map', // The id of the div element where the map will be rendered
  layers: [
    OSMLayer, // Add the OSM layer to the map
    tileLayer, // Add the tile layer to the map
    vectorLayer // Add the layer to the map
  ],
  view: view,
  controls: defaultControls({attribution: false}).extend([attribution]),
});

vectorSource.once('change', function (e) {
  if (vectorSource.getState() === 'ready') {
    if (vectorLayer.getSource().getFeatures().length > 0) {
      map.getView().fit(vectorSource.getExtent(), map.getSize(), {
        padding: [50, 50, 50, 50],
      });
    }
  }
});



// Geolocation

const geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: view.getProjection(),
});

geolocation.setTracking(true);

// handle geolocation error.
geolocation.on('error', function (error) {
  console.info(error.message);
});

const accuracyFeature = new Feature();
geolocation.on('change:accuracyGeometry', function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

const positionFeature = new Feature();
positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#3399CC',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
    }),
  }),
);

geolocation.on('change:position', function () {
  const coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
});

new VectorLayer({
  map: map,
  source: new VectorSource({
    features: [accuracyFeature, positionFeature],
  }),
});

// After the map becomes "stable" for the first time, fit the view to the specified extent
map.once('postrender', function () {
  // Hide the loading message
  document.getElementById('loading').style.display = 'none';
});