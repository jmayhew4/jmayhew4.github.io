/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell
 * 
 * 
 * NOTE: These are a series of functions for drawing in WebGL. As a student I had to produce functions to make this work.
 */


/*****
 * 
 * GLOBALS
 * 
 *****/

// 'draw_mode' are names of the different user interaction modes.
// \todo Student Note: others are probably needed...
var draw_mode = {DrawLines: 0, DrawTriangles: 1, ClearScreen: 2, None: 3, DrawQuads: 4};

// 'curr_draw_mode' tracks the active user interaction mode
var curr_draw_mode = draw_mode.DrawLines;

// GL array buffers for points, lines, and triangles
// \todo Student Note: need similar buffers for other draw modes...
var vBuffer_Pnt, vBuffer_Line;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
// \todo Student Note: need similar arrays for other draw modes...
var points = [], line_verts = [], tri_verts = [], quad_verts = [];

// count number of points clicked for new line
var num_pts_line = 0;

// \todo need similar counters for other draw modes...
var num_pts_triangles = 0;
var num_pts_quads = 0;
var totallines = 0;
var totaltris = 0;
var totalquads =  0;
var count = 0;


var lineR = [];
var lineG = [];
var lineB = [];
var triR = [];
var triG = [];
var triB = [];
var quadR = [];
var quadG = [];
var quadB = [];

var p = new Vec2();




/*****
 * 
 * MAIN
 * 
 *****/
function main() {
    
    math2d_test();
    
    /**
     **      Initialize WebGL Components
     **/
    
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return; 
    }

    // Initialize shaders
    if (!initShadersFromID(gl, "vertex-shader", "fragment-shader")) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // create GL buffer objects
    vBuffer_Pnt = gl.createBuffer();
    if (!vBuffer_Pnt) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_Line = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var skeleton=true;
    if(skeleton)
    {
        document.getElementById("App_Title").innerHTML += "-Skeleton";
    }

    // \todo create buffers for triangles and quads...

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // get GL shader variable locations
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }


    /**
     **      Set Event Handlers
     **
     **  Student Note: the WebGL book uses an older syntax. The newer syntax, explicitly calling addEventListener, is preferred.
     **  See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     **/
    // set event handlers buttons
    document.getElementById("LineButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawLines;
                
            });

    document.getElementById("TriangleButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawTriangles;
                
            });
    document.getElementById("QuadButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawQuads;
                
            });          
    
    document.getElementById("ClearScreenButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.ClearScreen;
                // clear the vertex arrays
                while (points.length > 0)
                    points.pop();
                while (line_verts.length > 0)
                    line_verts.pop();
                while (tri_verts.length > 0)
                    tri_verts.pop();
                while (quad_verts.length > 0)
                	quad_verts.pop();

                gl.clear(gl.COLOR_BUFFER_BIT);
                
                curr_draw_mode = draw_mode.DrawLines;
            });
            
    //\todo add event handlers for other buttons as required....   

    //       document.getElementById("DeleteButton").addEventListener(
            // "click",
            // function () {
            //     
            //      If Object is selected: delete the verts and push list to the left
            //      this is where I'd put the script, IF I KNEW HOW TO SELECT OBJECTS AHHHH
            //     
            // });
                

    // set event handlers for color sliders
    /* \todo right now these just output to the console, code needs to be modified... */
    document.getElementById("RedRange").addEventListener(
            "input",
            function () {
                console.log("RedRange:" + document.getElementById("RedRange").value);
                
            });
    document.getElementById("GreenRange").addEventListener(
            "input",
            function () {
                console.log("GreenRange:" + document.getElementById("GreenRange").value);
                
            });
    document.getElementById("BlueRange").addEventListener(
            "input",
            function () {
                console.log("BlueRange:" + document.getElementById("BlueRange").value);
                
            });                        
            
    // init sliders 
    // \todo this code needs to be modified ...
    // document.getElementById("RedRange").value = 0;
    // document.getElementById("GreenRange").value = 100;
    // document.getElementById("BlueRange").value = 0;



    // Register function (event handler) to be called on a mouse press
    canvas.addEventListener(
            "mousedown",
            function (ev) {
                handleMouseDown(ev, gl, canvas, a_Position, u_FragColor);
                });
}

/*****
 * 
 * FUNCTIONS
 * 
 *****/

/*
 * Handle mouse button press event.
 * 
 * @param {MouseEvent} ev - event that triggered event handler
 * @param {Object} gl - gl context
 * @param {HTMLCanvasElement} canvas - canvas 
 * @param {Number} a_Position - GLSL (attribute) vertex location
 * @param {Number} u_FragColor - GLSL (uniform) color
 * @returns {undefined}
 */
function handleMouseDown(ev, gl, canvas, a_Position, u_FragColor) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    var buttonPressed = ev.button;

    
    // Student Note: 'ev' is a MouseEvent (see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
    if (buttonPressed == 0){
    // convert from canvas mouse coordinates to GL normalized device coordinates
        x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
        y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

        if (curr_draw_mode !== draw_mode.None) {
            // add clicked point to 'points'
            points.push([x, y]);
        }

        // perform active drawing operation
        switch (curr_draw_mode) {
            case draw_mode.DrawLines:
                // in line drawing mode, so draw lines
                if (num_pts_line < 1) {			
                    // gathering points of new line segment, so collect points
                    line_verts.push([x, y]);
                    num_pts_line++;
                }
                else {						
                    // got final point of new line, so update the primitive arrays
                    line_verts.push([x, y]);
                    num_pts_line = 0;
                    points.length = 0;

                    lineR.push(RedRange.value/100);
                    lineG.push(GreenRange.value/100);
                    lineB.push(BlueRange.value/100);

                    totallines = totallines + 1;
                }break;
    		case draw_mode.DrawTriangles:
                // in triangle drawing mode, so draw triangles
                if (num_pts_triangles < 2) {			
                    // gathering points of new triangle, so collect points
                    tri_verts.push([x, y]);
                    num_pts_triangles++;
                }
                else {						
                    // got final point of new line, so update the primitive arrays
                    tri_verts.push([x, y]);
                    num_pts_triangles = 0;
                    points.length = 0;

                    triR.push(RedRange.value/100);
                    triG.push(GreenRange.value/100);
                    triB.push(BlueRange.value/100);

                    totaltris = totaltris + 1;
                }break;
            case draw_mode.DrawQuads:
            	// in triangle drawing mode, so draw triangles
                if (num_pts_quads < 3) {			
                    // gathering points of new quad, so collect points
                    quad_verts.push([x, y]);
                    num_pts_quads++;
                }
                else {						
                    // got final point of new line, so update the primitive arrays
                    quad_verts.push([x, y]);
                    num_pts_quads = 0;
                    points.length = 0;
                    quadR.push(RedRange.value/100);
                    quadG.push(GreenRange.value/100);
                    quadB.push(BlueRange.value/100);
                    totalquads = totalquads + 1;
                    console.log('Total Quads:', totalquads);
                    // totalquads is used to designate how to draw the quad later
                }break;
        }
    }

    if (buttonPressed == 2){
        // If right clicked, Select nearest line or object
    }
    drawObjects(gl,a_Position, u_FragColor);
    
}

/*
 * Draw all objects
 * @param {Object} gl - WebGL context
 * @param {Number} a_Position - position attribute variable
 * @param {Number} u_FragColor - color uniform variable
 * @returns {undefined}
 */


function drawObjects(gl, a_Position, u_FragColor) {

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw lines
    if (line_verts.length) {
        // enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(line_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        for(var x = 0; x < totallines; x++){
            gl.uniform4f(u_FragColor,  lineR[x], lineG[x], lineB[x], 1.0);
            // draw the lines
            gl.drawArrays(gl.LINES, x*2, 2 );
        }
    }

   // \todo draw triangles
   if (tri_verts.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(tri_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        for(var x = 0; x < totaltris; x++){
            gl.uniform4f(u_FragColor, triR[x], triG[x], triB[x], 1.0);
            // draw the line
            gl.drawArrays(gl.TRIANGLES, x*3, 3);
            
        }

   }
   // \todo draw quads
    if (quad_verts.length) {
      	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(quad_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        
        // draw the quad
        for(var x = 0; x < totalquads; x++){
            gl.uniform4f(u_FragColor, quadR[x], quadG[x], quadB[x], 1.0);

    		gl.drawArrays(gl.TRIANGLE_FAN, x*4, 4);
            // For each quad, we draw it based on how many quads exist
            gl.drawArrays(gl.TRIANGLES, x*4+1, 3);
            // Draw a triangle between the second and next points 
            // this ensures quad is drawn correctly  (instead of making flag shapes)
            
        }
   }
    
    // draw primitive creation vertices 
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    gl.drawArrays(gl.POINTS, 0, points.length);    


    // If an object is selected, draw verts at selected lines (start at total*line/tri/quads count 2/3/4 )
    // gl.drawArrays(gl.POINTS, selected start vert (), count: 2/3/4)

    // If an object is selected change color
    // if selected:
    //      gl.uniform4f(u_FragColor, (RedRange.value/100), (GreenRange.value/100), (BlueRange.value/100), 1.0;);
}

/**
 * Converts 1D or 2D array of Number's 'v' into a 1D Float32Array.
 * @param {Number[] | Number[][]} v
 * @returns {Float32Array}
 */
function flatten(v)
{
    var n = v.length;
    var elemsAreArrays = false;

    if (Array.isArray(v[0])) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array(n);

    if (elemsAreArrays) {
        var idx = 0;
        for (var i = 0; i < v.length; ++i) {
            for (var j = 0; j < v[i].length; ++j) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for (var i = 0; i < v.length; ++i) {
            floats[i] = v[i];
        }
    }

    return floats;
}
