window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();
var radius = 5;

function fmin(a, b) {
    if (a < b)
        return a;
    else
        return b;
}

function fmax(a, b) {
    if (a > b)
        return a;
    else
        return b;
}

function fabs(x) {
    if (x > 0)
        return x;
    else
        return -x;
}

function point(x0, y0) {
    this.x = x0;
    this.y = y0;
    this.radius = 5;
    this.fillStyle = 'red'      
    
    this.draw = function(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        context.fillStyle = this.fillStyle;
        context.fill();   
    }
    
    this.equals = function(p2) {
        return fabs(this.x - p2.x) < 1.0e-6 && fabs(this.y - p2.y) < 1.0e-6;
    }
    
    this.distSq = function(p2) {
        var dx = p2.x - this.x;
        var dy = p2.y - this.y;
        return dx*dx + dy*dy;
    }
    
    this.contained = function(x0, y0, w, h) {
        result = true;
        if (this.x < x0 || this.y < y0)
            result = false;
        if (this.x > x0 + w || this.y > y0 + h)
            result = false;
        return result;
    }
}

function slope(p1, p2) {
    x = p2.x - p1.x;
    y = p2.y - p1.y;
    if (x != 0)
        return 1.0*y/x;
    else
        return y*1.0e6;
}      

function intersection(p1, p2, q1, q2) {
    var mp = slope(p1,p2);
    var mq = slope(q1,q2);
    var xI = (mp*p1.x - mq*q1.x + q1.y - p1.y)/(mp-mq);
    var yI = mp*(xI - p1.x) + p1.y
    
    if(p1.x == p2.x) {
        xI = p1.x;
        yI = mq*(xI - q1.x) + q1.y;
    }
    else if(q1.x == q2.x) {
        xI = q1.x;
        yI = mp*(xI - p1.x) + p1.y;
    }
    else if(p1.y == p2.y) {
        yI = p1.y;
        xI = (yI - q1.y)/mq + q1.x;
    }
    else if(q1.y == q2.y) {
        yI = q1.y;
        xI = (yI - p1.y)/mp + p1.x
    }
    return new point(xI, yI);
}

function intersectSegment(p1, p2, q1, q2) {
    var pI = intersection(p1, p2, q1, q2);

    var lowX = fmin(p1.x, p2.x);
    var highX = fmax(p1.x, p2.x);
    var lowY = fmin(p1.y, p2.y);
    var highY = fmax(p1.y, p2.y);

    var lowX2 = fmin(q1.x, q2.x);
    var highX2 = fmax(q1.x, q2.x);
    var lowY2 = fmin(q1.y, q2.y);
    var highY2 = fmax(q1.y, q2.y);

    var aa = pI.contained(lowX,lowY,highX-lowX,highY-lowY)
    var bb = pI.contained(lowX2,lowY2,highX2-lowX2,highY2-lowY2)
    return aa&&bb;
}

function intersectsExistingDiagonals(ip, jp, points, diagonal) {
    var result = false;
    p1 = points[ip];
    p2 = points[jp];
    var np = points.length;
    for(var i=0; i<np-1; i++){
        for(var j=i+1; j<np; j++){
            ni = diagonal[i];
            if (ni.indexOf(j) > -1 && !(i == ip || j == jp || i == jp || j == ip)) {
                var pI = intersection(p1, p2, points[i], points[j]);
                if (intersectSegment(p1,p2, points[i], points[j])){
                    result = true;
                }
            }
        }
    }
    return result;
}

function addPointToTriangulation(p, points, triangulation){
    points.push(p);
    triangulation.push([]);
    var np = points.length;
    for(var i=0; i<np-1; i++){
        var intersects = intersectsExistingDiagonals(i,np-1,points,triangulation);
        if(!intersects){
            triangulation[i].push(np-1);
            triangulation[np-1].push(i);
        }
    }
}

function flipDiagonals(points, triangulation){                    
    var np = points.length;
    var flipped = true; 
    while(flipped) {
        flipped = false;
        for(var i=0; i<np; i++){
            if(flipped)
                continue;
            var pi = points[i];
            var ti = triangulation[i];
            for(var m=0; m<ti.length; m++){
                if(flipped)
                    continue;
                var j = ti[m];
                var pj = points[j];
                var tj = triangulation[j];
                for(var n=0; n<ti.length; n++){
                    if(flipped)
                        continue;
                    if(m != n){
                        var k = ti[n];
                        var kIndextj = tj.indexOf(k);
                        if(kIndextj > -1){
                            var pk = points[k];
                            var tk = triangulation[k];
                            for(var o=0; o<tj.length; o++){
                                if(flipped)
                                    continue;
                                var l = tj[o];
                                if(l != i && l != j && tk.indexOf(l) > -1) {
                                    var pl = points[l];
                                    if(ti.indexOf(l) < 0) {
                                        tj.splice(kIndextj,1);
                                        jIndextk = tk.indexOf(j);                      
                                        tk.splice(jIndextk,1);
                                        if(pi.distSq(pl) < pj.distSq(pk) && !intersectsExistingDiagonals(i,l,points,triangulation)){
                                            ti.push(l);
                                            var tl = triangulation[l];
                                            tl.push(i);
                                            flipped = true;
                                            continue;
                                        }
                                        else{
                                            tj.push(k);
                                            tk.push(j);
                                            kIndextj = tj.indexOf(k);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }        
        }
    }
}
    
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

var startX = 0;
var startY = 0;

canvas.addEventListener('mousedown',mousePressed,false);
canvas.addEventListener('mouseup',mouseReleased,false);

canvas.width = window.innerWidth
canvas.height = window.innerHeight
context.clearRect(0, 0, canvas.width*2, canvas.height);
var points = [];
var triangulation = [];

function mousePressed (e) {
    var rect = canvas.getBoundingClientRect();
    var startX = e.clientX - rect.left;
    var startY = e.clientY - rect.top;
    var newPoint = new point(startX, startY);
    addPointToTriangulation(newPoint, points, triangulation);
    flipDiagonals(points, triangulation);
    requestAnimFrame(function(){drawPolygon(points, canvas, context, triangulation);});
}

function mouseReleased (e) {
    
}

function drawPolygon(points, canvas, context, triangulation) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var np = points.length;
        for(i=0; i<np-1; i++) {
            ni = triangulation[i];
            for(j=i+1; j<np; j++){
                if (ni.indexOf(j) > -1){
                    context.beginPath();
                    context.moveTo(points[i].x, points[i].y);
                    context.lineTo(points[j].x, points[j].y);
                    context.stroke();
                }
            }
        }
    for (i=0; i<np; i++) {
        points[i].draw(context);
    }
}
