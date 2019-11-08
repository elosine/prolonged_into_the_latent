// GLOBAL VARIABLES ------------------------------------- //
//TIMING & ANIMATION ENGINE /////////////
var frmRate = 60.0;
var framect = 0;
var delta = 0.0;
var lastFrameTimeMs = 0.0;
var timestep = 1000.0 / frmRate;
var pieceClock = 0.0;
var clockadj = 0.0;
var timeToGo = 3.0;
var pxPerSec = 100.0;
var pxPerFrame = pxPerSec / frmRate;
var pxPerMs = pxPerSec / 1000.0;
//STATUS BAR ////////////////////////////
var sb = true;
var statusbar = document.getElementById('statusbar');
//SCENE /////////////////////////////////
var renderer, scene, camera, pointLight, spotLight;
var fieldLength = 700;
var fieldWidth = 150;
//COLORS /////////////////////////////////
var clr_limegreen = new THREE.Color("rgb(153, 255, 0)");
var clr_yellow = new THREE.Color("rgb(255, 255, 0)");
var clr_orange = new THREE.Color("rgb(255, 128, 0)");
//TEMPO FRETS ///////////////////////////////
var tfmatl, gofret, tfbgeom, tfbmatl, gofretborder;
var gofretposx = -340;
var gofretposz = 3;
var tfs = [];
var gofretTimer = 0;
var tfgeom = new THREE.CubeGeometry(4, 194, 5);
var gofretGeomBig = new THREE.CubeGeometry(6, 198, 9);
var tfbgeom = new THREE.EdgesGeometry(tfgeom);
var tfbgeomBig = new THREE.EdgesGeometry(gofretGeomBig);

// SET UP ----------------------------------------------- //
function setup() {
  createScene();
  requestAnimationFrame(mainLoop);
}
// FUNCTION: CREATE SCENE ------------------------------- //
function createScene() {
  //Scene Size
  var WIDTH = 500;
  var HEIGHT = 300;
  //Camera Attributes
  var VIEW_ANGLE = 45;
  var ASPECT = WIDTH / HEIGHT;
  var NEAR = 0.1;
  var FAR = 10000;
  //Get DOM div
  var c = document.getElementById("tlcanvas");
  // create a WebGL renderer, camera, and a scene
  renderer = new THREE.WebGLRenderer();
  camera =
    new THREE.PerspectiveCamera(
      VIEW_ANGLE,
      ASPECT,
      NEAR,
      FAR);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x708090);
  scene.add(camera);
  //Camera Position
  camera.position.x = -(fieldLength / 2) - 95;
  camera.position.z = 120;
  camera.rotation.y = -60 * Math.PI / 180;
  camera.rotation.z = -90 * Math.PI / 180;
  //Start the renderer
  renderer.setSize(WIDTH, HEIGHT);
  //Attach the render-supplied DOM element
  c.appendChild(renderer.domElement);
  //Set up the playing surface plane
  var planeLength = fieldLength;
  var planeWidth = fieldWidth + 50;
  var planeQuality = 10;
  var planeMaterial =
    new THREE.MeshLambertMaterial({
      color: 'black'
    });
  var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(
      planeLength * 0.99, // 95% of table width, since we want to show where the ball goes out-of-bounds
      planeWidth,
      planeQuality,
      planeQuality
    ),
    planeMaterial
  );
  scene.add(plane);
  plane.receiveShadow = true;
  //TEMPO FRETS ///////////////////////////////////////////
  gfmatl = new THREE.MeshBasicMaterial({
    color: "rgb(255,255,0)"
  });
  tfmatl = new THREE.MeshBasicMaterial({
    color: "rgb(255,128,0)"
  });
  tfbmatl = new THREE.LineBasicMaterial({
    color: 0x000000,
  });
  gofret = new THREE.Mesh(tfgeom, gfmatl);
  gofretborder = new THREE.LineSegments(tfbgeom, tfbmatl);
  gofretborder.renderOrder = 1; // make sure wireframes are rendered 2nd
  gofret.position.x = gofretposx;
  gofret.position.z = gofretposz;
  gofretborder.position.x = gofretposx;
  gofretborder.position.z = gofretposz;
  scene.add(gofret);
  scene.add(gofretborder);

  // ADD TEMPO FRETS
  //given start time, tempo, #beats, get destination frame
  var itfstarttime = 7;
  var tempo = 67.3;
  var numbeats = 12;
  //durpx = initialstarttime*pxPerSec
  //startpx = durpx + gofretposx
  //durframes = durpx/pxPerFrame
  //destination frame = framect + durframes
  var durpx = itfstarttime * pxPerSec;
  var istartpx =durpx + gofretposx;
  var idurframes = durpx / pxPerFrame;
  var igoframe = Math.round(framect + idurframes);
  //igoframe + dur of beat in frames
  //pause at destination, print framect, destination frame, position.x
  for (var i = 0; i < 12; i++) {
    //Add orange fret and move
    var tft = new THREE.Mesh(tfgeom, tfmatl);
    var tfbt = new THREE.LineSegments(tfbgeom, tfbmatl);
    tfbt.renderOrder = 1;
    var pxPerBeat = pxPerSec / (tempo / 60);
    var startpx = istartpx + (pxPerBeat * i);
    var goframe = Math.round(igoframe + ( (pxPerBeat/pxPerFrame) * i ));
    tft.position.x = startpx;
    tft.position.z = gofretposz;
    tfbt.position.x = startpx;
    tfbt.position.z = gofretposz;
    tft.name = "tft" + i;
    tfbt.name = "tfbt" + i;
    /* [
    boolean:add (so it is added to the scene only once),
    tft: tempo fret mesh,
    tfbt: wireframe mesh,
    goframe
    ] */

    var ntft = [true, tft, tfbt, goframe];
    tfs.push(ntft);
  }

  // // create a point light
  pointLight =
    new THREE.PointLight(0xF8D898);
  // set its position
  pointLight.position.x = -1000;
  pointLight.position.y = 0;
  pointLight.position.z = 1000;
  pointLight.intensity = 2.9;
  pointLight.distance = 10000;
  // add to the scene
  scene.add(pointLight);
  // add a spot light
  spotLight = new THREE.SpotLight(0xF8D898);
  spotLight.position.set(0, 0, 460);
  spotLight.intensity = 1.5;
  spotLight.castShadow = true;
  scene.add(spotLight);
  // MAGIC SHADOW CREATOR DELUXE EDITION with Lights PackTM DLC
  renderer.shadowMapEnabled = true;
}
// DRAW --------------------------------------------------------- //
function draw() {
  //Status Bar ///////////////////////////
  if (sb) {
    statusbar.textContent = "Time: " + (pieceClock / 1000).toFixed(2) + " " + "Frame: " + framect.toFixed(1) + " " + "Clock: " + (Date.now() / 1000).toFixed(2);
  }
  // MAIN TIMELINE THREE.JS SCENE
  renderer.render(scene, camera);
}
// UPDATE ------------------------------------------------------ //
function update(timestep) {
  framect++;
  //Clock //////////////////////////////////
  pieceClock += timestep;
  pieceClock = pieceClock - clockadj;
  //Tempo FRETS /////////////////////////////
  for (var i = 0; i < tfs.length; i++) { //if it has not reached go fret
    if (tfs[i][1].position.x > gofretposx) {
      tfs[i][1].position.x -= pxPerFrame;
      tfs[i][2].position.x -= pxPerFrame;
    }
    //add the tf to the scene if it is in the scene
    if (tfs[i][1].position.x < 300) {
      if (tfs[i][0]) { //gate so the tf is only added to the scene once
        tfs[i][0] = false;
        scene.add(tfs[i][1]);
        scene.add(tfs[i][2]);
      }
    }
    if (framect == tfs[i][3]) { //when the tf reaches its destination frame
        console.log("Time: " + (pieceClock / 1000).toFixed(2)
        +  " " + "Frame: " + framect.toFixed(1) + " " +
      "TFpos: " + tfs[i][1].position.x + " " + "goFretpos: " + gofretposx
       + " " + "goframe: " + tfs[i][3]);
      // set gofretTimer so it blinks clr_limegreen
      gofretTimer = framect + 12;
      scene.remove(scene.getObjectByName(tfs[i][1].name));
      scene.remove(scene.getObjectByName(tfs[i][2].name));
      tfs.splice(i, 1);
    }
  }
  //GO FRET /////////////////////////////////
  if(framect >= gofretTimer){
    gofret.material.color = clr_yellow;
    gofret.geometry = tfgeom;
    gofretborder.geometry = tfbgeom;
  }
  else{
    gofret.material.color = clr_limegreen;
    gofret.geometry = gofretGeomBig;
    gofretborder.geometry = tfbgeomBig;
  }
}
// ANIMATION ENGINE -------------------------------------------- //
function mainLoop(timestamp) {
  delta += timestamp - lastFrameTimeMs;
  lastFrameTimeMs = timestamp;
  while (delta >= timestep) {
    update(timestep);
    delta -= timestep;
  }
  draw();
  requestAnimationFrame(mainLoop);
}
