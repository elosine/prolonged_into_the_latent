// GLOBAL VARIABLES ---------------------------------------------------- //
// TIMING & ANIMATION ENGINE /////////////////////////////
var FRAMERATE = 60.0;
var MSPERFRAME = 1000.0 / FRAMERATE;
var SECPERFRAME = 1.0 / FRAMERATE;
var PXPERSEC = 150.0;
var PXPERMS = PXPERSEC / 1000.0;
var PXPERFRAME = PXPERSEC / FRAMERATE;
var framect = 0;
var delta = 0.0;
var lastFrameTimeMs = 0.0;
var pieceClock = 0.0;
var clockadj = 0.0;
// COLORS /////////////////////////////////////////////////
var clr_neonMagenta = new THREE.Color("rgb(255, 21, 160)");
var clr_neonBlue = new THREE.Color("rgb(6, 107, 225)");
var clr_forest = new THREE.Color("rgb(11, 102, 35)");
var clr_jade = new THREE.Color("rgb(0, 168, 107)");
var clr_neonGreen = new THREE.Color("rgb(57, 255, 20)");
var clr_limegreen = new THREE.Color("rgb(153, 255, 0)");
var clr_yellow = new THREE.Color("rgb(255, 255, 0)");
var clr_orange = new THREE.Color("rgb(255, 128, 0)");
var clr_red = new THREE.Color("rgb(255, 0, 0)");
var clr_purple = new THREE.Color("rgb(255, 0, 255)");
var clr_neonRed = new THREE.Color("rgb(255, 37, 2)");
var clr_safetyOrange = new THREE.Color("rgb(255, 103, 0)");
var clr_green = new THREE.Color("rgb(0, 255, 0)");
var fretClr = [clr_limegreen, clr_neonMagenta];
// SCENE /////////////////////////////////////////////////
var CANVASW = 1400;
var CANVASH = 700;
var RUNWAYLENGTH = 1070;
var camera, scene, renderer, canvas;
var GOFRETLENGTH = 11;
var GOFRETHEIGHT = 4;
var GOFRETPOSZ = -GOFRETLENGTH / 2;
var GOFRETWIDTH = 64;
var timeCodeByPart_goPx_goFrm = [];
var goFretGeom = new THREE.CubeGeometry(GOFRETWIDTH, GOFRETHEIGHT, GOFRETLENGTH);
var goFretMatl = new THREE.MeshLambertMaterial({
  color: clr_neonGreen
});
var goFretAdd = 3;
var goFretBigGeom = new THREE.CubeGeometry(GOFRETWIDTH + goFretAdd, GOFRETHEIGHT + goFretAdd, GOFRETLENGTH + goFretAdd);
var tempoFretGeom = new THREE.CubeGeometry(GOFRETWIDTH, GOFRETHEIGHT, GOFRETLENGTH);
var numTracks = 16;
var trackXoffset = 634;
var trdiameter = 10;
var spaceBtwnTracks = (trackXoffset * 2) / (numTracks - 1);
var eventMatrix;
var goFretBlink = [];
for (var i = 0; i < numTracks; i++) {
  goFretBlink.push(0);
}
var goFrets = []; //[goFret, goFretMatl]
// NOTATION SVGS ////////////////////////////////////////
var svgNS = "http://www.w3.org/2000/svg";
var testpitch = document.createElementNS(svgNS, 'image');
var testpitch2 = document.createElementNS(svgNS, 'image');
// SET UP -------------------------------------------------------------- //
function setup() {
  createScene();
  init();
  requestAnimationFrame(animationEngine);
}
document.addEventListener('keydown', function(event) {
  if (event.code == 'KeyA') {
    fbf()
  }
});

function fbf() {
  update(MSPERFRAME);
  draw();
}
// FUNCTION: init ------------------------------------------------------ //
function init() {
  eventMatrix = mkEventMatrix();
}
// FUNCTION: createScene ---------------------------------------------- //
function createScene() {
  // Camera ////////////////////////////////
  camera = new THREE.PerspectiveCamera(75, CANVASW / CANVASH, 1, 3000);
  // camera.position.set(0, 500, 39);
  camera.position.set(0, 560, -148);
  // camera.rotation.x = rads(-48);
  camera.rotation.x = rads(-68);
  // Scene /////////////////////////////////
  scene = new THREE.Scene();
  // LIGHTS ////////////////////////////////
  var sun = new THREE.DirectionalLight(0xFFFFFF, 1.2);
  sun.position.set(100, 600, 175);
  scene.add(sun);
  var sun2 = new THREE.DirectionalLight(0x40A040, 0.6);
  sun2.position.set(-100, 350, 200);
  scene.add(sun2);
  // Renderer //////////////////////////////
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(CANVASW, CANVASH);
  canvas = document.getElementById('tlcanvas1');
  canvas.appendChild(renderer.domElement);
  // RUNWAY //////////////////////////////////
  var runwayMatl =
    new THREE.MeshLambertMaterial({
      color: 0x0040C0
    });
  var runwayGeom = new THREE.PlaneGeometry(
    CANVASW,
    RUNWAYLENGTH,
  );
  var runway = new THREE.Mesh(runwayGeom, runwayMatl);
  runway.position.z = -RUNWAYLENGTH / 2;
  runway.rotation.x = rads(-90);
  scene.add(runway);

  //TRACKS ///////////////////////////////////////////
  var trgeom = new THREE.CylinderGeometry(trdiameter, trdiameter, RUNWAYLENGTH, 32);
  var trmatl = new THREE.MeshLambertMaterial({
    color: 0x708090
  });
  var trackXpos = [];
  for (var i = 0; i < numTracks; i++) {
    var tTr = new THREE.Mesh(trgeom, trmatl);
    tTr.rotation.x = rads(-90);
    tTr.position.z = -(RUNWAYLENGTH / 2);
    tTr.position.y = -trdiameter / 2;
    tTr.position.x = -trackXoffset + (spaceBtwnTracks * i);
    scene.add(tTr);
    var tGoFretSet = [];
    var goFretMatl = new THREE.MeshLambertMaterial({
      color: clr_neonGreen
    });
    tGoFret = new THREE.Mesh(goFretGeom, goFretMatl);
    tGoFret.position.z = GOFRETPOSZ;
    tGoFret.position.y = GOFRETHEIGHT;
    var tTrackXpos = -trackXoffset + (spaceBtwnTracks * i);
    tGoFret.position.x = tTrackXpos;
    trackXpos.push(tTrackXpos);
    scene.add(tGoFret);
    tGoFretSet.push(tGoFret);
    tGoFretSet.push(goFretMatl);
    goFrets.push(tGoFretSet);
  }
  // SVG NOTATION ///////////////////////////////////////////////
  testpitch.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '/svgs/fs5.svg');
  testpitch.setAttributeNS(null, 'width', 250);
  testpitch.setAttributeNS(null, 'height', 250);
  testpitch.setAttributeNS(null, 'visibility', 'visible');
  document.getElementById("notationLSVG").appendChild(testpitch);
  testpitch2.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '/svgs/aqf5.svg');
  testpitch2.setAttributeNS(null, 'width', 250);
  testpitch2.setAttributeNS(null, 'height', 250);
  testpitch2.setAttributeNS(null, 'visibility', 'visible');
  document.getElementById("notationRSVG").appendChild(testpitch2);
  // RENDER /////////////////////////////////////////////
  renderer.render(scene, camera);
}
// FUNCTION: animationEngine ------------------------------------- //
function animationEngine(timestamp) {
  delta += timestamp - lastFrameTimeMs;
  lastFrameTimeMs = timestamp;
  while (delta >= MSPERFRAME) {
    update(MSPERFRAME);
    draw();
    delta -= MSPERFRAME;
  }
  requestAnimationFrame(animationEngine);
}
// UPDATE -------------------------------------------------------------- //
function update(aMSPERFRAME) {
  // CLOCK ///////////////////////////////////////////////
  framect++;
  pieceClock += aMSPERFRAME;
  pieceClock = pieceClock - clockadj;
  // // EVENTS /////////////////////////////////////////////////////
  //FOLLOW BELOW TO MAKE EVENT FRETS
  if (test) test = false;
  for (var i = 0; i < eventMatrix.length; i++) {
    for (var j = 0; j < eventMatrix[i].length; j++) {
      //add the tf to the scene if it is on the runway
      if (eventMatrix[i][j][1].position.z > (-RUNWAYLENGTH)) {
        if (eventMatrix[i][j][0]) {
          eventMatrix[i][j][0] = false;
          scene.add(eventMatrix[i][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (eventMatrix[i][j][1].position.z < GOFRETPOSZ) {
        eventMatrix[i][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == eventMatrix[i][j][2]) {
        // [true, tempTempoFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx];

        // console.log("----------------");
        // console.log("Track#: " + i);
        // console.log("framect: " + framect);
        // console.log("PieceClk: " + (pieceClock / 1000));
        // console.log("PxClk: " + (pieceClock * PXPERMS));
        // console.log("GoFrame: " + eventMatrix[i][j][2]);
        // console.log("GoTime: " + eventMatrix[i][j][3]);
        // console.log("NumPxTilGo: " + eventMatrix[i][j][4]);
        // console.log("GoPx: " + eventMatrix[i][j][5]);
        // console.log("posz: " + eventMatrix[i][j][1].position.z);
        // console.log("GOFRETPOSZ: " + GOFRETPOSZ);


        goFretBlink[i] = framect + 9;
        // console.log(goFretBlink);
        //remove tf from scene
        scene.remove(scene.getObjectByName(eventMatrix[i][j][1].name));
        // break;
      }
    }
  }
}
var test = true;
// DRAW ----------------------------------------------------------------- //
function draw() {
  // // GO FRET BLINK TIMER ///////////////////////////////////
  for (var i = 0; i < goFretBlink.length; i++) {
    if (framect <= goFretBlink[i]) {
      // console.log("+++++++++++++++++++++");
      // console.log("FrameCt: " + framect);
      // console.log(goFretBlink);
      // console.log("+++++++++++++++++++++");
      goFrets[i][0].material.color = clr_safetyOrange;
      goFrets[i][0].geometry = goFretBigGeom;
    } else {
      goFrets[i][0].material.color = clr_neonGreen;
      goFrets[i][0].geometry = goFretGeom;
    }

  }
  // if (framect >= goFretTimerL) {
  //   goFretL.material.color = clr_yellow;
  //   goFretL.geometry = goFretGeom;
  // } else {
  //   goFretL.material.color = clr_safetyOrange;
  //   goFretL.geometry = goFretBigGeom;
  // }
  // if (framect >= goFretTimerR) {
  //   goFretR.material.color = clr_yellow;
  //   goFretR.geometry = goFretGeom;
  // } else {
  //   goFretR.material.color = clr_safetyOrange;
  //   goFretR.geometry = goFretBigGeom;
  // }
  // // EVENT BLINK TIMER ///////////////////////////////////
  // if (framect >= eventGoTimerL) {
  //   eventGoL.material.color = clr_neonGreen;
  //   eventGoL.geometry = eventGoGeom;
  // } else {
  //   eventGoL.material.color = clr_red;
  //   eventGoL.geometry = eventGoBigGeom;
  // }
  // if (framect >= eventGoTimerR) {
  //   eventGoR.material.color = clr_neonGreen;
  //   eventGoR.geometry = eventGoGeom;
  // } else {
  //   eventGoR.material.color = clr_red;
  //   eventGoR.geometry = eventGoBigGeom;
  // }
  // RENDER ///////////////////////////////////
  renderer.render(scene, camera);
}
// FUNCTION: rads ---------------------------------------------------- //
function rads(deg) {
  return (deg * Math.PI) / 180;
}
// FUNCTION: mkEventSection ------------------------------------------- //
//find initial go pixel for each event
//find goframe for each event


//CHANGE THIS FUNCTION TO CREATE THE EVENT FRETS AS WELL
//FLATTEN EVENTS INTO ONE Array/
//EACH WITH  var newTempoFret = [true, tempTempoFret, tempGoFrame, COLOR(ALTERNATE WITH NEW TEMPO)];
function mkEventMatrix() {
  var tEventMatrix = [];
  var tempoFretIx = 0;
  for (var i = 0; i < timeCodeByPart.length; i++) {
    var tTempoFretSet = [];
    for (var j = 0; j < timeCodeByPart[i].length; j++) {
      for (var k = 0; k < timeCodeByPart[i][j].length; k++) {
        var tTimeGopxGoFrm = [];
        var tTime = timeCodeByPart[i][j][k];
        var tNumPxTilGo = tTime * PXPERSEC;
        var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
        var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
        // var tGoFrm = Math.round(tTime * FRAMERATE);
        var tempMatl = new THREE.MeshLambertMaterial({
          color: fretClr[j % 2]
        });
        var tempTempoFret = new THREE.Mesh(tempoFretGeom, tempMatl);
        tempTempoFret.position.z = tiGoPx;
        tempTempoFret.position.y = GOFRETHEIGHT;
        tempTempoFret.position.x = -trackXoffset + (spaceBtwnTracks * i);
        tempTempoFret.name = "tempofret" + tempoFretIx;
        tempoFretIx++;
        var newTempoFret = [true, tempTempoFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
        tTempoFretSet.push(newTempoFret);
      }
    }
    tEventMatrix.push(tTempoFretSet);
  }
  return tEventMatrix;
}

// FUNCTION: mkEventSection ------------------------------------------- //
// function mkEventSection(startTime, numbeats, tempo, trnum, fretClr, eventSet) {
//   var tempoFretSet = [];
//   var numPxTilGo = startTime * PXPERSEC;
//   var iGoPx = GOFRETPOSZ - numPxTilGo;
//   var iGoFrame = numPxTilGo / PXPERFRAME;
//   var pxPerBeat = PXPERSEC / (tempo / 60);
//   // Make Tempo Frets ////////////////////////////////////
//   for (var i = 0; i < numbeats; i++) {
//     var tempStartPx = iGoPx - (pxPerBeat * i);
//     var tempGoFrame = Math.round(iGoFrame + ((pxPerBeat / PXPERFRAME) * i));
//     var tempMatl = new THREE.MeshLambertMaterial({
//       color: fretClr
//     });
//     var tempTempoFret = new THREE.Mesh(tempoFretGeom, tempMatl);
//     tempTempoFret.position.z = tempStartPx;
//     tempTempoFret.position.y = TEMPOFRETHEIGHT;
//     if (trnum == 0) {
//       tempTempoFret.position.x = -TRDISTFROMCTR;
//     } else {
//       tempTempoFret.position.x = TRDISTFROMCTR;
//     }
//     tempTempoFret.name = "tempofret" + tempoFretIx;
//     tempoFretIx++;
//     var newTempoFret = [true, tempTempoFret, tempGoFrame];
//     tempoFretSet.push(newTempoFret);
//   }
//   // Make Events /////////////////////////////////////////////
//   var tempEventSet = [];
//   for (var i = 0; i < eventSet.length; i++) {
//     var tempEvent = new THREE.Mesh(eventGeom, eventMatl);
//     var startpx, goframe;
//     //Events can be scheduled by beat or seconds
//     //Events Scheduled by beat
//     if (eventSet[i][0] == 0) {
//       startpx = iGoPx - (pxPerBeat * eventSet[i][1]);
//       goframe = iGoFrame + Math.round((pxPerBeat / PXPERFRAME) * eventSet[i][1]);
//     }
//     //events Scheduled by seconds
//     else if (eventSet[i][0] == 1) {
//       startpx = iGoPx - (PXPERSEC * eventSet[i][1]);
//       goframe = iGoFrame + Math.round(FRAMERATE * eventSet[i][1]);
//     }
//     tempEvent.position.z = startpx;
//     tempEvent.position.y = EVENTGOHEIGHT;
//     if (trnum == 0) {
//       tempEvent.position.x = -TRDISTFROMCTR;
//     } else {
//       tempEvent.position.x = TRDISTFROMCTR;
//     }
//     tempEvent.name = "event" + i;
//     var tempEventArray = [true, tempEvent, goframe];
//     tempEventSet.push(tempEventArray);
//   }
//   return [tempoFretSet, tempEventSet];
// }
