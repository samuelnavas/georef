function parseKML(){
// Interpolate Position and Orientation for each second
var finalPositions = [];
var finalHeaders = [];

for(seconds = 0; seconds <= v.duration; seconds++){
  var fullRoute = route.getLatLngs();

  // LERP POSITION
  //if(fullRoute.length>1){
  var i=1;
  var currentLatLng;
  while(i<fullRoute.length){
    var latlng1 = fullRoute[i];
    var latlng0 = fullRoute[i-1];
    if(seconds<times[i] && seconds>times[i-1]){
      currentLatLng = interpolatePosition(latlng1, latlng0,
        times[i]-times[i-1],
        times[i]-seconds);
      i= Number.MAX_SAFE_INTEGER;
    } else {
      currentLatLng= latlng1;
      i++;
    }
  }
  finalPositions.push(currentLatLng);

  // SLERP ORIENTATION
  //if(waypoints.length>1){
  var i = 1;
  var alpha;
  while(i<waypoints.length){
    var wp1 = waypoints[i];
    var wp0 = waypoints[i-1];
    if(seconds<wp1.timestamp && seconds>wp0.timestamp){
      alpha = interpolateOrientation( wp1.alpha, wp0.alpha,
        wp1.timestamp-wp0.timestamp,
        wp1.timestamp-seconds );
      i= Number.MAX_SAFE_INTEGER;
    } else{
      alpha= wp1.alpha;
      i++;
    }
  }
  finalHeaders.push(alpha);
//}
}

//calcualteOrientation();

// END OF INTERPOLATION
//var video_name = v.src.replace(/\.[^/.]+$/, "");
var latlngs = route.getLatLngs();
var output = "";
output += '<?xml version="1.0" encoding="UTF-8"?>\n';
output += '<kml>\n';
output += '<Document>\n';
output += '<name>'+video_name+'</name>\n';
$.ajax({
  timeout: 5000,
  type: "GET",
  url:"http://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat="+waypoints[0].getLatLng().lat+"&lon="+waypoints[0].getLatLng().lng,
  dataType:"json",
  async:false,
  success: function(json){
    output += '<address> '+json.display_name+'</address>\n';
  }
});
//output += '<address> GEOREVERSE FIRST WAYPOINT </address>\n';
var milliseconds = (new Date()).getTime() - myTimer.getTime();
output += '<description> User study time: '+milliseconds/1000+' </description>\n';
output += '<Schema name="VideoGeotagging" id="VideoGeotagging">\n';
output += '<SimpleField name="Position" type="int" />\n';
output += '<SimpleField name="Date" type="string" />\n';
output += '<SimpleField name="Time" type="string" />\n';
output += '<SimpleField name="Lat" type="double" />\n';
output += '<SimpleField name="Lon" type="double" />\n';
output += '<SimpleField name="Accuracy" type="double" />\n';
output += '<SimpleField name="Speed" type="double" />\n';
output += '<SimpleField name="Heading" type="double" />\n';
output += '</Schema>\n';
for(i=0; i<finalPositions.length; i++){
  output += '<Placemark id="'+(i+1)+'">\n';
  output += '<name>'+(i+1)+'</name>\n';
  output += '<Point>\n';
  output += '<coordinates>'+finalPositions[i].lng+','+finalPositions[i].lat+'</coordinates>\n';
  output += '</Point>\n';
  output += '<ExtendedData>\n';
  output += '<SchemaData schemaUrl="#VideoGeotagging">\n';
  output += '<SimpleData name="Position">'+i+'</SimpleData>\n';
  output += '<SimpleData name="Date">'+getSystemCurrentDate("/")+'</SimpleData>\n';
  output += '<SimpleData name="Time">'+"00:"+zeroPad(parseInt(i/60,10),2)+':'+zeroPad(Math.floor(i%60),2)+'</SimpleData>\n';
  output += '<SimpleData name="Lat">'+finalPositions[i].lat+'</SimpleData>\n';
  output += '<SimpleData name="Lon">'+finalPositions[i].lng+'</SimpleData>\n';
  output += '<SimpleData name="Accuracy">'+0+'.'+0+'</SimpleData>\n';
  output += '<SimpleData name="Speed">'+0+'.'+0+'</SimpleData>\n';
  output += '<SimpleData name="Heading">'+finalHeaders[i]+'</SimpleData>\n';
  output += '</SchemaData>\n';
  output += '</ExtendedData>\n'
  output += '</Placemark>\n';
}
output += '<Placemark id="0">\n';
output += '<name>'+video_name+'</name>\n';
output += '<LineString>\n';
output += '<coordinates>';
for(i=0;i<finalPositions.length; i++){
  output += finalPositions[i].lng+','+finalPositions[i].lat+" ";
}
output += '</coordinates>\n';
output += '</LineString>\n';
output += '</Placemark>\n';
output += '</Document>\n';
output += '</kml>';
// Set up the link
var link = document.createElement("a");
link.setAttribute("target","_blank");
if(Blob !== undefined) {
  var blob = new Blob([output], {type: "text/plain"});
  link.setAttribute("href", URL.createObjectURL(blob));
} else {
  link.setAttribute("href","data:text/plain," + encodeURIComponent(output));
}
link.setAttribute("download",video_name+"_Interpolated.kml");
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
//var kmlFile = new File(video_name+".kml");
//kmlFile.open("w"); //
//kmlFile.writeln(output);
//kmlFile.close();
}



function parseKML2(){
//var video_name = v.src.replace(/\.[^/.]+$/, "");
var output = "";
output += '<?xml version="1.0" encoding="UTF-8"?>\n';
output += '<kml>\n';
output += '<Document>\n';
output += '<name>'+video_name+'</name>\n';
$.ajax({
  timeout: 5000,
  type: "GET",
  url:"http://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat="+waypoints[0].getLatLng().lat+"&lon="+waypoints[0].getLatLng().lng,
  dataType:"json",
  async:false,
  success: function(json){
    output += '<address> '+json.display_name+'</address>\n';
  }
});
//output += '<address> GEOREVERSE FIRST WAYPOINT </address>\n';
var milliseconds = (new Date()).getTime() - myTimer.getTime();
output += '<description> User study time: '+milliseconds/1000+' </description>\n';
output += '<Schema name="VideoGeotagging" id="VideoGeotagging">\n';
output += '<SimpleField name="Position" type="int" />\n';
output += '<SimpleField name="Date" type="string" />\n';
output += '<SimpleField name="Time" type="string" />\n';
output += '<SimpleField name="Lat" type="double" />\n';
output += '<SimpleField name="Lon" type="double" />\n';
output += '<SimpleField name="Accuracy" type="double" />\n';
output += '<SimpleField name="Speed" type="double" />\n';
output += '<SimpleField name="Heading" type="double" />\n';
output += '</Schema>\n';
for(i=0;i<waypoints.length; i++){
  output += '<Placemark id="'+(i+1)+'">\n';
  output += '<name>'+(i+1)+'</name>\n';
  output += '<Point>\n';
  output += '<coordinates>'+waypoints[i].getLatLng().lng+','+waypoints[i].getLatLng().lat+'</coordinates>\n';
  output += '</Point>\n';
  output += '<ExtendedData>\n';
  output += '<SchemaData schemaUrl="#VideoGeotagging">\n';
  output += '<SimpleData name="Position">'+i+'</SimpleData>\n';
  output += '<SimpleData name="Date">'+getSystemCurrentDate("/")+'</SimpleData>\n';
  output += '<SimpleData name="Time">'+waypoints[i].timestamp+'</SimpleData>\n';
  output += '<SimpleData name="Lat">'+waypoints[i].getLatLng().lat+'</SimpleData>\n';
  output += '<SimpleData name="Lon">'+waypoints[i].getLatLng().lng+'</SimpleData>\n';
  output += '<SimpleData name="Heading">'+waypoints[i].fov+'</SimpleData>\n';
  output += '</SchemaData>\n';
  output += '</ExtendedData>\n'
  output += '</Placemark>\n';
}
output += '<Placemark id="0">\n';
output += '<name>'+video_name+'</name>\n';
output += '<LineString>\n';
output += '<coordinates>';
for(i=0;i<waypoints.length; i++){
  output += waypoints[i].getLatLng().lng+','+waypoints[i].getLatLng().lat+" ";
}
output += '</coordinates>\n';
output += '</LineString>\n';
output += '</Placemark>\n';
output += '</Document>\n';
output += '</kml>';
// Set up the link
var link = document.createElement("a");
link.setAttribute("target","_blank");
if(Blob !== undefined) {
  var blob = new Blob([output], {type: "text/plain"});
  link.setAttribute("href", URL.createObjectURL(blob));
} else {
  link.setAttribute("href","data:text/plain," + encodeURIComponent(output));
}
link.setAttribute("download",video_name+"_Waypoints.kml");
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}