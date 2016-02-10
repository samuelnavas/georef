WpMarker = L.Marker.extend({
  initialize: function (latlng, timestamp, fieldOfView, options) {
    L.Marker.prototype.initialize.call(this, latlng, options);

    /*this.latlng = latlng.map(function(e, index) {    
      return L.latLng(e);
    });*/

    this.timestamp = timestamp;
    this.fov = fieldOfView;
    this.alpha = 0;

    this.uriLatLng = function(){
      return this.getLatLng().lat+","+this.getLatLng().lng;
    };
  }
}); 