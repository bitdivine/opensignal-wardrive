$(document).ready(function(){
  // Made with Open Street Map v3.6.0
  // Docs: http://openlayers.org/en/v3.6.0/doc/
  plot();
  document.getElementById('csv_files').addEventListener('change', onUpload, false);
});
function plot(datapoints){
  datapoints = datapoints || [];
  var limits = frame(datapoints);
  var mapLayer = mkMapLayer(datapoints);
  var markerLayer = mkMarkerLayer(datapoints);
  document.getElementById('map').innerHTML = '';
console.log("datapoints:", datapoints);
console.log("Bounds:", limits.lonMid,limits.latMid);
  var map = new ol.Map({
    target: 'map',
    layers:
    [ mapLayer
    , markerLayer
    ],
    view: new ol.View(
    { center: ol.proj.transform([limits.lonMid,limits.latMid], 'EPSG:4326', 'EPSG:3857')
    , zoom: 1
    }),
    interactions: ol.interaction.defaults({mouseWheelZoom:false})
  });
  hoverText(map, markerLayer);
  window.map = map;
  return map;
}
function mkMapLayer(){
  return new ol.layer.Tile({
    source: new ol.source.MapQuest({layer: 'osm'}) // sat osm hyb
  });
}

function mkMarkerLayer(datapoints){
  var source = new ol.source.Vector({});
  datapoints.forEach(function(p){
    source.addFeature(new ol.Feature(
    { geometry: new ol.geom.Point
	(ol.proj.transform
		([p.lon,p.lat]
		, 'EPSG:4326',   'EPSG:3857'
		)
	)
    , name: p.network_type && p.CID && ''+p.network_type+' '+p.CID
    }));
  });
  var style = new ol.style.Style({
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ (
    { anchor: [0.5, 1]
    , anchorXUnits: 'fraction'
    , anchorYUnits: 'fraction'
    , opacity: 1
    , src: 'img/orange-eye.png'
    , scale: 0.05
    }))
  });
  var layer = new ol.layer.Vector({
    source: source,
    style:  style
  });
  return layer;
}
function hoverText(map,markerLayer){
	/*
	map.on('pointermove', function(evt) {
		if (evt.dragging) return;
		var pixel = map.getEventPixel(evt.originalEvent);
		displayFeatureInfo(map, pixel);
	});
	*/
	map.on('click', function(evt) {
		displayFeatureInfo(map, evt.pixel);
	});
}
function displayFeatureInfo(map,pixel){
	var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
		console.log(feature.get('name'));
		window.ftr = feature;
	});
}
function onUpload(){
	window.location.hash = "#";
	window.location.hash = "#map";
	getDatapoints().then(plot).then(function(map){
		map.getView().setZoom(13);
	});
}
function getDatapoints(){
  /*
  var ans =
  [ {lat:52.04172,lon:-0.75583}
  ];
  */
	return loadFiles().then(function(a){
console.log("getting", a);
		return [].concat.apply([],a);
	});
}
function loadFiles(){
	var files = [].slice.apply(document.getElementById("csv_files").files);
	console.log(files); // list of File objects
	return Promise.all(files.filter(function(file){return /[.]csv$/.test(file.name);}).map(function(f){
		return loadFile(f).then(parseFile);
	}));
}
function loadFile(file){
	return new Promise(function(resolve,reject){
		var reader = new FileReader();
		reader.onload = function(){ resolve({name:file.name,data:reader.result}); };
		reader.onerror = reject;
		reader.readAsText(file);
	});
}
function parseFile(bundle){
  var lines = bundle.data.split(/[\n\r]+/).map(function(s){return JSON.parse('['+s+']');});
  var header = lines[0];
  var lookup_names =
  [ ["lat", "my_lat", Number]
  , ["lon", "my_lon", Number]
  , ["network_type", "network_type", String]
  , ["CID", "CID", String]
  ];
  lookup_names.forEach(function(a){a.push(header.indexOf(a[1]));});
  return lines.slice(1).reduce(function(a, line){
	var ans = lookup_names.reduce(function(d,a){d[a[0]]=a[2](line[a[3]]);return d;},{});
	if (!(isNaN(ans.lat)||isNaN(ans.lon))) a.push(ans);
	return a;
  },[]);
}
function frame(datapoints){
  var ans = datapoints.reduce(function(d,p){ 
	if (!(d.latMin<p.lat)) d.latMin = p.lat;
	if (!(d.latMax>p.lat)) d.latMax = p.lat;
	if (!(d.lonMin<p.lon)) d.lonMin = p.lon;
	if (!(d.lonMax<p.lon)) d.lonMax = p.lon;
	return d;
    }
  , {}
  );
  ans.latMid = datapoints.length && (ans.latMin+ans.latMax)/2;
  ans.lonMid = datapoints.length && (ans.lonMin+ans.lonMax)/2;
  return ans;
}
