      var v =  document.querySelector("video");
      var b =  document.querySelector("#timeline");
      var t =  document.querySelector("#thumb");
      var c =  document.querySelector("#showcaptionscheck");
      var clock = document.querySelector("#clock");
      var vehicle = "foot";
      var video_name;
      var waypoints = [];
      var interpolatedTimes = [];
      var lastWP = null;
      var rotating = false;
      var map = null;
      var path;
      var route;
      var routes = [];
      var distances = [];
      var times = [];
      var headings = [];
      var auxPoly;
      var currentFoV;
      var currentPos;
      var selected;
      var seconds = 0;
      var myTimer;

      // DEBUG VARIABLES
      var debug = false;
      var debugline;
      var debugPoints = [];

      introJs().setOptions({ 
        'exitOnOverlayClick': 'false', 
        'showStepNumbers': 'false', 
        'showStepNumbers': 'false'
      }).start();

      function callback(result) {
        if (result){
          waypoints = [];
          updateBlueMarks();
          b.style.background = "#000";
          if(map!=null){ map.remove(); map=null; } 
          var value = $( "select option:selected" ).val();
          video_name = value.replace(/\.[^/.]+$/, ""); 
          if(value!=""){
            v.src = "http://geotag.samuelnavas.es/videos/"+value;
            v.load();
            v.addEventListener('loadedmetadata', function() {
            b.innerHTML = '<div align="center">'+
                            '<p class="alignleft">0:00</p>' +
                            '<p class="alignright">'+zeroPad(parseInt(v.duration/60,10),2)+':'+zeroPad(Math.floor(v.duration%60),2)+'</p>'+
                            '<p class="aligncenter">'+zeroPad(parseInt((v.duration/2)/60,10),2)+':'+zeroPad(Math.floor((v.duration/2)%60),2)+'</p>'+
                            '<div style="clear: both;"></div>'+
                          '</div>';
            });
            init();
          } else{
            v.src=null;
            //if(map!=null) map.remove();
            b.style.background = "#707070";
            removeChilds(document.getElementById("sugestedPlaces"));
          }
        selected= $( "select option:selected" ).val();
        } else{
          $( "select" ).val(selected);
        } 
      }

      $( "select" ).change(function(e) {
        var value = $( "select option:selected" ).val();
        if(waypoints.length>0){
          $('#myModal').modal('show');
        } else {
          callback($( "select option:selected" ).text());
        }
      });

      function init(){
        v.play();
        v.pause();

        // LEAFLET
        map = L.map('map', {
                //crs: L.CRS.EPSG3857,
                //crs: L.CRS.Simple,
        }).setView([49.4252669, 7.6240972], 4);
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //L.tileLayer('http://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/14/4823/6160.vector.pbf?access_token=pk.eyJ1Ijoic25hdmFzIiwiYSI6ImNpaG96Mm9rOTAwMDJ1eGtxeWoxbjJ4c2sifQ.NemNiPbB_mKOAKTckz9u_A', {

                attribution:  '(c) <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors |'+
                              ' Powered by <a href="https://graphhopper.com/#directions-api" target="_blank">GraphHopper API</a> |'+
                              ' Samuel Navas Medrano',
                maxZoom:19 
        }).addTo(map);
        map.attributionControl.setPrefix('<a href="http://leafletjs.com/" target=blank> Leaflet</a>');
        //map.fitBounds(L.latLngBounds(L.latLng(55.05812359,15.0418962),L.latLng(47.2701115,5.8663425)));
        path = L.polyline([], {color: 'blue', opacity:0}).addTo(map);
        if (debug) debugline = L.polyline([], {color: 'green'}).addTo(map);
        route = L.polyline([],{color:'blue',weight:10,opacity:0.2}).addTo(map);
        auxPoly = L.polygon([],{color: 'grey', opacity:0, fillOpacity:0}).addTo(map);
        currentFoV = L.polygon([],{color: 'red'}).addTo(map);
        currentPos = L.marker([90,180],{
          //opacity:0,
          icon: L.icon({
            iconUrl: 'img/icon-red.png',
            shadowUrl: 'img/icon-black.png',
            iconSize: [25, 25],
            shadowSize:   [25, 25], // size of the shadow
            shadowAnchor: [11, 11],  // the same for the shadow
          }),
          zIndexOffset:1000,
          clickable: false,
          keyboard: false
        }).addTo(map);

        map.on('mousemove', function(e){
          if (rotating){
            var latlng1 = e.latlng;
            //var wp2 = waypoints[waypoints.length-1];
            var wp2 = lastWP;
            var latlng2 = wp2.getLatLng();
            if (debug) debugline.setLatLngs([latlng1, latlng2]);
            wp2.fov.setStyle({color: 'orange', opacity: 0, fillOpacity:0});
            auxPoly.setStyle({color: 'grey', opacity: 0.5, fillOpacity:0.2});
            wp2.alpha = getAngle(latlng1,latlng2);
            auxPoly.setLatLngs(rotatePoly(wp2.fov.getLatLngs(),wp2.alpha));
          }
        });

        map.on('click', function(e) {
          if(!rotating){
            if (waypoints.length == 10){
              alert("This is a demo version limited to 10 waypoints");
            }
            else{  
              v.pause();
              var fov = L.polygon([e.latlng,getFoVPoint(e.latlng,true),getFoVPoint(e.latlng,false)],{color: 'grey', opacity: 0.5, fillOpacity:0.2}).addTo(map);
              var wp = new WpMarker(e.latlng, v.currentTime, fov, {
                draggable: true,
                icon: L.icon({
                  iconUrl: 'img/marker-icon.png',
                  shadowUrl: 'img/marker-shadow.png',
                  iconRetinaUrl: 'img/marker-icon-2x.png',
                  iconSize:    [25, 41],
                  iconAnchor:  [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize:  [41, 41],
                }),
              });
              //var marker = L.circle([e.latlng.lat, e.latlng.lng],10,{zIndexOffset:1000,color:'black'});
              wp.bindPopup("<button onclick='goTo("+v.currentTime+")'>"+v.currentTime+"</button><br><input type='button' value='Delete' class='marker-delete-button'/>");
              wp.on('popupopen', function(e) {
                  $(".marker-delete-button:visible").click(function () {
                      map.removeLayer(e.popup._source);
                      wpRemove(e.popup._source);
                      printRoute("GraphHopper");
                  });
                });
              currentPos.setLatLng(e.latlng);
              //var wp = new WayPoint(marker,v.currentTime,fov);
              waypoints.push(wp);
              waypoints.sort(function(a, b){
                return a.timestamp-b.timestamp;
                //return a.timestamp > b.timestamp ? 1 : -1;
              });
              wp.animateDragging().addTo(map);
              lastWP = wp;
              printRoute("GraphHopper");
              updateBlueMarks();
              rotating = true;
            }
          } else {
            var wp2 = lastWP;
            wp2.fov.setStyle({color: 'orange', opacity: 0.5, fillOpacity:0.2});
            auxPoly.setStyle({color: 'grey', opacity: 0, fillOpacity:0});
            wp2.fov.setLatLngs(auxPoly.getLatLngs());
            rotating = false;
            if (debug) debugline.setLatLngs([]);
          }  
        });

        // GEOPARSING
        var videoTitle = $( "select option:selected" ).text();
        videoTitle = encodeURIComponent(videoTitle.trim());
        var gmapsAPI = "http://maps.googleapis.com/maps/api/geocode/json?language=en&address=";
        console.log(gmapsAPI+videoTitle);
        var jsonData = $.ajax({
              url:gmapsAPI+videoTitle,
              dataType:"json",
              async:true,
              success: function(json){
                removeChilds(document.getElementById("sugestedPlaces"));
                while (sugestedPlaces.firstChild) {
                  sugestedPlaces.removeChild(sugestedPlaces.firstChild);
                }
                $.each(json.results, function(k,v) {
                  var node = document.createElement("LI");
                  //var lat = v['geometry']['location']['lat'];
                  //var lng = v['geometry']['location']['lng'];
                  //var place = L.latLng(v['geometry']['location']['lat'], v['geometry']['location']['lng']);
                  var southWest = L.latLng(v['geometry']['viewport']['northeast']['lat'], v['geometry']['viewport']['northeast']['lng']);
                  var northEast = L.latLng(v['geometry']['viewport']['southwest']['lat'], v['geometry']['viewport']['southwest']['lng']);
                  var bounds = L.latLngBounds(southWest, northEast);
                  var textnode = document.createTextNode(v['formatted_address']);
                  node.appendChild(textnode);
                  //node.addEventListener("click",function(){locatePlace(map,lat,lng)});
                  node.addEventListener("click",function(){map.fitBounds(bounds)});
                  document.getElementById("sugestedPlaces").appendChild(node);
                });
              myTimer = new Date();
              }
            }).responseText;

      }

      // VIDEO BUTTONS
      //var myVideo = document.getElementById("video1"); 
      function playPause() { 
          if (v.paused){
              v.play(); 
              //document.getElementById("playPause").innerHTM = ;
          } else { 
              v.pause();
              //document.getElementById("playPause").name=" ▶ ";
          }
      } 

      function rewind() { 
          goTo(0);
      }

      function speed(radio){
        v.playbackRate = radio.value;
      }

      function fullScreen() { 
        v.webkitEnterFullscreen();
      }

      function pad(number, length) {
        var str = '' + number;
        while (str.length < length) {
          str = '0' + str;
        }
        return str;
      }

      // VIDEO CONTROLER
      v.addEventListener('click',play,false);
      v.addEventListener('timeupdate',update,false);

      b.addEventListener('mouseover',show,false);
      b.addEventListener('mouseout',hide,false);
      b.addEventListener('mousemove',render,false);
      b.addEventListener('click',seek,false);

      function goTo(time){
        v.currentTime = time;
        v.pause();
      }

      //c.addEventListener('change',check(c));
      function play() {
        if(v.paused) { v.play(); } else { v.pause(); }
      }

      function update() {
        // UPDATE DE TIMELINE
        //console.log(v);
        var p = v.currentTime/v.duration*100;
        
        clock.innerHTML=zeroPad(parseInt(v.currentTime/60,10),2)+':'+zeroPad(Math.floor(v.currentTime%60),2);
        //clock.innerHTML="t = "+v.currentTime;
        b.style.background = "linear-gradient(to right, #500 "+p+"%, #000 "+p+"%)";
        updateBlueMarks();
        var fullRoute = route.getLatLngs();
        // UPDATE THE POSITION ICON
        if(fullRoute.length>1){
          var i=1;
          while(i<fullRoute.length){ 
            var latlng1 = fullRoute[i];
            var latlng0 = fullRoute[i-1];
            if(v.currentTime<times[i] && v.currentTime>times[i-1]){
              var currentLatLng = interpolatePosition(latlng1, latlng0,
                                                      times[i]-times[i-1],
                                                      times[i]-v.currentTime);
              currentPos.setLatLng(currentLatLng);
              i= Number.MAX_SAFE_INTEGER;
            } else {
              currentPos.setLatLng(latlng1);
              i++;
            }
          }
        }

        // UPDATE THE ORIENTATION ICON
        if(waypoints.length>1){
          var i = 1;
          while(i<waypoints.length){
            var wp1 = waypoints[i];
            var wp0 = waypoints[i-1];
            if(v.currentTime<wp1.timestamp && v.currentTime>wp0.timestamp){
              var alpha = interpolateOrientation(wp1.alpha, wp0.alpha,
                                                wp1.timestamp-wp0.timestamp,
                                                wp1.timestamp-v.currentTime);
              var latlngs = [currentLatLng, getFoVPoint(currentLatLng, true), getFoVPoint(currentLatLng, false)];
              var rotated_latlngs = rotatePoly(latlngs, alpha);
              currentFoV.setLatLngs(rotated_latlngs);
              i= Number.MAX_SAFE_INTEGER;
            } else{
              currentFoV.setLatLngs([]);
              i++;
            } 
          }
        }
      }

      function render(e) {
        // find the current cue
        var c = v.textTracks[0].cues;

        if(!c.length) { return; }
        var p = (e.pageX-b.offsetLeft) * v.duration / $(window).width();
        for (var i=0; i<c.length; i++) {
            if(c[i].startTime <= p && c[i].endTime > p) {
                break;
            };
        }
        //alert(i);
        // style the element
        //var xywh = c[i].text.substr(c[i].text.indexOf("=")+1).split(',');
        //t.style.backgroundImage = 'url(videos/'+c[i]+')';
        //console.log('videos/img'+pad(i,3)+'.jpg');
        t.style.backgroundImage = 'url(videos/'+video_name+'/img'+pad(i,3)+'.jpg)';
        t.style.backgroundSize = '160px 90px';
        //console.log('url(videos/img'+pad(i,3)+'.jpg)');
        t.style.backgroundPosition = '-'+0+'px -'+0+'px';
        if(e.pageX - 160/2 < 0) t.style.left = 0+'px';
        else if (e.pageX + 160 - 160/2 > $(window).width()) t.style.left = $(window).width()-160;
        else t.style.left = e.pageX - 160/2+'px';  
        //t.style.left = e.pageX - 160/2+'px';  
        //console.log(t.style.left);
        t.style.top = b.offsetTop - 90+8+'px';
        //console.log(b.offsetTop - 90+8+'px');
        t.style.width = 160+'px';
        t.style.height = 90+'px';
      };

      function show() {
        t.style.visibility = 'visible';
      };

      function hide() {
        t.style.visibility = 'hidden';
      };

      function seek(e) {
        // DOESNT WORK WITH BROWSER ZOOM, WE NEED JQUERY INSTEAD
        //v.currentTime = (e.pageX-b.offsetLeft)*v.duration/screen.width;
        v.currentTime = (e.pageX-b.offsetLeft)*v.duration/$(window).width();
        //if(v.paused) { v.play(); }
      } 

      function check(checkbox){
        //console.log("holamundo");
        //console.log(v.textTracks[0]);
        var a = [];
        if (checkbox.checked){
          console.log("checked!");
          a = v.textTracks[1].cues;
        } else {
          console.log("unchecked!");
        }
        for (var i=0; i<a.length; i++) {
          console.log(a[i].text);
          var s = document.createElement("span");
          s.style.left = (a[i].startTime/v.duration*$(window).width()-2)+"px";
          s.style.backgroundColor = a[i].text;
          t.style.width = 4+'px';
          t.style.height = 40+'px';
          b.appendChild(s);
        }
      }

      function locatePlace(map,lat,lng) {
        map.panTo(new L.LatLng(lat, lng));
        map.setZoom(12);
      };

      function printRoute(option){
            //for(i=0; i<routes.length; i++){
            //  map.removeLayer(routes[i]);
            //}
            routes = [];
            distances = [];
            console.log("vaciando routes[]: "+routes.length);
            for(i=1; i<waypoints.length; i++){
              var url = "https://graphhopper.com/api/1/route?";
              url += "point="+waypoints[i-1].uriLatLng()+"&";
              url += "point="+waypoints[i].uriLatLng()+"&";
              url += "vehicle="+vehicle+"&locale=en&points_encoded=false&debug=true&instructions=false&";
              url += "key=92aebea9-b1cc-44ea-8848-7cc11609691e";
              console.log(url);
              var jsonData = $.ajax({
                timeout: 5000,
                type: "GET",
                url:url,
                dataType:"json",
                async:false,
                success: function(json){
                  var coords = [];
                  console.log(json);
                  console.log(json.paths[0].distance);
                  var routeDistance = json.paths[0].distance;
                  $.each(json.paths[0].points.coordinates, function(k,v) {
                    coords.push(L.latLng(v[1], v[0]));
                  });
                  //var fragment = L.polyline(coords,{color:'blue',weight:10,opacity:0.2}).addTo(map);
                  routes.push(coords);
                  distances.push(routeDistance);
                  //interpolateTime();
                }
              }).responseText;
            }

            console.log("waypoints.length: "+waypoints.length);
            console.log("routes.length: "+routes.length);
            console.log(routes);
            var latlngs = [];
            if((waypoints.length >= 2) && (routes.length > 0)){
              for(i=0; i<routes.length; i++){
                latlngs.push(waypoints[i].getLatLng());
                latlngs = latlngs.concat(routes[i]);
              }
              latlngs.push(waypoints[routes.length].getLatLng());
              console.log("final latlngs");
              console.log(latlngs);
              //route.setLatLngs(latlngs);
            }
            route.setLatLngs(latlngs);
            calcualteTime();
      }

      function calcualteTime(){
        times = [];
        var counter = 0;
        var fullRoute = route.getLatLngs();
        //console.log(fullRoute);
        //alert("pause0");
        console.log(distances);
        for(i=0; i<routes.length; i++){
          var totalDistance = distances[i];
          var currentDistance = 0;
          times.push(waypoints[i].timestamp);
          counter++;
          for(j=0; j<routes[i].length; j++){
            currentDistance += distance(fullRoute[counter-1], fullRoute[counter]);
            times.push(interpolateTime(waypoints[i+1].timestamp, 
                                       waypoints[i].timestamp,
                                       totalDistance, totalDistance-currentDistance));
            counter++;
          }
        }
        times.push(waypoints[routes.length].timestamp);
        console.log("times array!");
        console.log(times);
        console.log("times.length should be equal to route.length: "+times.length+"="+fullRoute.length);
        if (debug) print_debug_points();
      }

      function print_debug_points(){
        var fullRoute = route.getLatLngs();
        for(i=0; i<debugPoints.length; i++){
          map.removeLayer(debugPoints[i]);
        }
        for(i=0; i<fullRoute.length; i++){
          debugPoints.push(L.circle(fullRoute[i], 1).addTo(map).bindPopup("t: "+times[i]));
        }
      }

      function interpolateTime(t1, t2, distance, d){
        // LERP
        var k = d/distance;
        k = (k>0) ? k : 0;
        k = (k>1) ? 1 : k;
        //console.log(o1 + k*(o2-o1));
        return t1 + k*(t2-t1);
        (start + percent*(end - start));
      }

      function distance(latlng1, latlng2){
        /*
        var R = 6371000; // metres
        var lat1 = latlng1.lat.toRadians();
        var lat2 = latlng1.lat.toRadians();
        var Alat = (latlng2.lat-latlng1.lat).toRadians();
        var Alng = (latlng2.lng-latlng1.lng).toRadians();
        var a = Math.sin(Alat/2) * Math.sin(Alat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(Alng/2) * Math.sin(Alng/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d;
        */
        // Haversine formula
        return latlng1.distanceTo(latlng2);
      }

      function wpRemove(marker){
        for(i=0; i<waypoints.length; i++){
          if (waypoints[i] == marker){
            console.log("match!");
            map.removeLayer(waypoints[i].fov);
            waypoints.splice(i,1);
            updateBlueMarks();
          }
        }
      }

      function getPolyLineLength(polyline){
        var _latlngs = polyline.getLatLngs();
        var distance = 0;
        for (i=1; i<_latlngs.length; i++){
          distance += _latlngs[i].distanceTo(_latlngs[i-1]);
        }
      }

      // OGC 05-115: If the view extent of the camera is not specified, the default value of 30m
      // will be used to calculate the points by the service. If the horizontal view angle is not
      // specified a default value of 60 degrees will be used.
      function getFoVPoint(latlng,left){
        // Radius of Earth in meters
        //var r = 6378000;
        var r = 6378000;
        //var mXlng = (2*pi/360) * 6378000 * cos(latlng.lat);
        var dy = 30;
        var dx = 30*Math.tan(30*Math.PI/180);
        //var dx = 0;
        if(left) dx = dx*(-1);
        var new_latitude  = latlng.lat + (dy / r) * (180 / Math.PI);
        var new_longitude = latlng.lng + (dx / (r*Math.cos(Math.PI*latlng.lat/180))) * (180 / Math.PI);

        return L.latLng(new_latitude,new_longitude);
      }

      function interpolatePosition(p1, p2, duration, t) {
        // LERP
        var k = t/duration;
        k = (k>0) ? k : 0;
        k = (k>1) ? 1 : k;
        return L.latLng(p1.lat + k*(p2.lat-p1.lat), p1.lng + k*(p2.lng-p1.lng));
      }

      function interpolateOrientation(o1, o2, duration, t){
        // SLERP
        var k = t/duration;
        k = (k>0) ? k : 0;
        k = (k>1) ? 1 : k;
        var v1 = new Victor(Math.cos(o1.toRadians()), Math.sin(o1.toRadians()));
        var v2 = new Victor(Math.cos(o2.toRadians()), Math.sin(o2.toRadians()));
        var dot = v1.dot(v2);
        var theta = Math.acos(dot)*k;
        var aux = new Victor(v1.x*dot, v1.y*dot);
        var relative = v2.clone();
        relative = relative.subtract(aux);
        relative.normalize();
        var result = new Victor(v1.x*Math.cos(theta), v1.y*Math.cos(theta));
        var newRelative = new Victor(relative.x*Math.sin(theta), relative.y*Math.sin(theta));
        result.add(newRelative);
        var resultAngle = result.angle().toDegrees();
        console.log("k: "+k+", o1: "+o1+", o2: "+o2+", r="+resultAngle);
        return resultAngle;
      }

      function fixAngle(delta){
        if(delta>360) delta -= 360;
        else if(delta<0) delta += 360;
        return delta;
      }

      function calcualteOrientation(){
        headings = [];
        var counter = 0;
        //var fullRoute = route.getLatLngs();
        for(i=0; i<routes.length; i++){
          //var totalDistance = distances[i];
          //var currentDistance = 0;
          headings.push(waypoints[i].alpha);
          counter++;
          for(j=0; j<routes[i].length; j++){
            //currentDistance += distance(fullRoute[counter-1], fullRoute[counter]);
            /*
              if(v.currentTime<wp1.timestamp && v.currentTime>wp0.timestamp){
              var alpha = interpolateOrientation(wp1.alpha, wp0.alpha,
                                                wp1.timestamp-wp0.timestamp,
                                                wp1.timestamp-v.currentTime);
            */
            headings.push(interpolateOrientation(waypoints[i+1].alpha, 
                                       waypoints[i].alpha,
                                       waypoints[i+1].timestamp-waypoints[i].timestamp,
                                       waypoints[i+1].timestamp-times[counter]));
            counter++;
          }
        }
        headings.push(waypoints[routes.length].alpha);
        console.log("headers array!");
        console.log(headings);
        //console.log("headers.length should be equal to route.length: "+headings.length+"="+fullRoute.length);
      }

      function calculateHeaders(){
        headers = [];
        var latlngs = route.getLatLngs();
        for(i=0;i<latlngs.length;i++){
          interpolateOrientation(o1, o2, duration, t);
        }

        var i = 1;
        while(i<waypoints.length){
          var wp1 = waypoints[i];
          var wp0 = waypoints[i-1];
          if(v.currentTime<wp1.timestamp && v.currentTime>wp0.timestamp){
            var alpha = interpolateOrientation(wp1.alpha, wp0.alpha,
                                                wp1.timestamp-wp0.timestamp,
                                                wp1.timestamp-v.currentTime);
            var latlngs = [currentLatLng, getFoVPoint(currentLatLng, true), getFoVPoint(currentLatLng, false)];
              var rotated_latlngs = rotatePoly(latlngs, alpha);
              currentFoV.setLatLngs(rotated_latlngs);
              i= Number.MAX_SAFE_INTEGER;
            } else{
              currentFoV.setLatLngs([]);
              i++;
            } 
          }
      }

      function getAngle(wp1,wp2){
        // METHOD 2
          var dy = wp2.lat - wp1.lat;
          var dx = Math.cos(Math.PI/180*wp1.lat) * (wp2.lng - wp1.lng);
          var angle = Math.atan2(dx, dy).toDegrees()
          angle = (angle + 360) % 360;
          angle -= 180;
          //console.log(fixAngle(angle));
          return fixAngle(angle);
      }

      function rotatePoly(latlngs, alpha){
        // ROTATION OF GEOGRAPHICAL COORDINATES
        var clat = latlngs[0].lat;
        var clng = latlngs[0].lng;
        var newLatLngs = [];
        newLatLngs.push(new L.LatLng(clat, clng));
        for(i=1; i<latlngs.length; i++){
          var lat = latlngs[i].lat;
          var lon = latlngs[i].lng;
          var newlat = clat + (Math.cos(alpha.toRadians()) * (lat - clat) - Math.sin(alpha.toRadians()) * (lon - clng) * Math.abs(Math.cos(clat.toRadians())));
          var newlng = clng + (Math.sin(alpha.toRadians()) * (lat - clat) / Math.abs(Math.cos(clat.toRadians())) + Math.cos(alpha.toRadians()) * (lon - clng) );
          newLatLngs.push(new L.LatLng(newlat, newlng));
        }
        return newLatLngs;

        // ROTATION OF PIXEL POINTS
        /*
        var pointsArray = [];
        var newLatLngs = [];
        //console.log(latlngs);
        for(i=0; i<latlngs.length; i++){
          pointsArray.push(map.project(latlngs[i]));
        }
        newLatLngs.push(latlngs[0]);
        var cx = pointsArray[0].x;
        var cy = pointsArray[0].y;
        for(i=1; i<pointsArray.length; i++){
          // METHOD 1
          //var newx = Math.cos(alpha * Math.PI / 180) * (pointsArray[i].x - cx) - Math.sin(alpha * Math.PI / 180) * (pointsArray[i].y - cy) + cx;
          //var newy = Math.sin(alpha * Math.PI / 180) * (pointsArray[i].x - cx) + Math.cos(alpha * Math.PI / 180) * (pointsArray[i].y - cy) + cy;
          // METHOD 2
          var s = Math.sin(alpha * Math.PI / 180);
          var c = Math.cos(alpha * Math.PI / 180);
          var newx = pointsArray[i].x - cx;
          var newy = pointsArray[i].y - cy;
          var dx = newx * c - newy * s;
          var dy = newy * c + newx * s;
          newx = dx + cx;
          newy = dy + cy;
          newLatLngs.push(map.unproject(L.point(newx, newy)));
        }
        //console.log(pointsArray);
        return newLatLngs;*/
      }

      function drawFoV(wpMarker, map){
        var latlngs = [wpMarker.getLatLng(), getFoVPoint(wpMarker.getLatLng(),true), getFoVPoint(wpMarker.getLatLng(),false)];
        var newlatlngs = rotatePoly(latlngs, wpMarker.alpha);
        wpMarker.fov.setLatLngs(latlngs);
      }

      function removeChilds(element){
         while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
      }

      function updateBlueMarks(){
        removeChilds(b);
        
        for(i=0; i<waypoints.length; i++){
          var s = document.createElement("span"); 
          //t.style.left = $(window).width()-160;
          s.style.left = (waypoints[i].timestamp/v.duration*$(window).width()-6)+"px";
          //s.style.width = 4+'px';
          //s.style.height = 60+'px';
          //s.style.backgroundColor = '#00C';
          b.appendChild(s);
        }
        b.innerHTML += '<div align="center">'+
                            '<p class="alignleft">0:00</p>' +
                            '<p class="alignright">'+zeroPad(parseInt(v.duration/60,10),2)+':'+zeroPad(Math.floor(v.duration%60),2)+'</p>'+
                            '<p class="aligncenter">'+zeroPad(parseInt((v.duration/2)/60,10),2)+':'+zeroPad(Math.floor((v.duration/2)%60),2)+'</p>'+
                            '<div style="clear: both;"></div>'+
                          '</div>';
        /**/
      }

      function changevehicle(radio){
        console.log("vehicle changed to: "+radio.value);
        vehicle = radio.value;
        printRoute("GraphHopper");
      }

      function zeroPad(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
      }

      L.Marker.prototype.animateDragging = function () {
        var iconMargin, shadowMargin;
        
        this.on('dragstart', function () {
          if (!iconMargin) {
            iconMargin = parseInt(L.DomUtil.getStyle(this._icon, 'marginTop'));
            shadowMargin = parseInt(L.DomUtil.getStyle(this._shadow, 'marginLeft'));
          }
        
          this._icon.style.marginTop = (iconMargin - 15)  + 'px';
          this._shadow.style.marginLeft = (shadowMargin + 8) + 'px';
        });
        
        return this.on('dragend', function () {
          this._icon.style.marginTop = iconMargin + 'px';
          this._shadow.style.marginLeft = shadowMargin + 'px';
          drawFoV(this, map);
          printRoute("GraphHopper");
          lastWP = this;
          rotating = true;
        });
      };

      // from: http://www.movable-type.co.uk/scripts/latlong-convert-coords.html
      /** Extend Number object with method to convert numeric degrees to radians */
      if (Number.prototype.toRadians === undefined) {
          Number.prototype.toRadians = function() { return this * Math.PI / 180; };
      }


      /** Extend Number object with method to convert radians to numeric (signed) degrees */
      if (Number.prototype.toDegrees === undefined) {
          Number.prototype.toDegrees = function() { return this * 180 / Math.PI; };
      }

      function getSystemCurrentDate(separator){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) {
            dd='0'+dd
        } 

        if(mm<10) {
            mm='0'+mm
        } 

        return mm+separator+dd+separator+yyyy;
      }

      // TODO: PUT ALL THIS FUNCTIONS INTO A SEPARATE JS
      //       AMONG WITH THE SECONDS AND TIMER VARIABLES

      function timerAddSecond(){
        seconds++;
      }

      function timerReset(){
        seconds = 0;
        timerStop();
        timerStart();
      }

      function timerStop(){
        clearInterval(myTimer);
      }

      function timerStart(){
        myTimer = setInterval(timerAddSecond, 10);
      }

      function save(){
        parseKML();
        parseKML2();
      }

      console.log("Javascript loaded");