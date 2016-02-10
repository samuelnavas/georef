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