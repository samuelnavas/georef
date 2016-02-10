      var v =  document.querySelector("video");
      var b =  document.querySelector("#timeline");
      var t =  document.querySelector("#thumb");
      var c =  document.querySelector("#showcaptionscheck");
      var clock = document.querySelector("#clock");

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