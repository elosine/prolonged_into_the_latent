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
var svgXlink = 'http://www.w3.org/1999/xlink';
var pitchContainers = [];
var pitchContainerDOMs = [];
var notes;
// MISC ////////////////////////////////////////
var played = false;
var currentNotation = [];
// SET UP -------------------------------------------------------------- //
function setup() {
  createScene();
  eventMatrix = mkEventMatrix();
  init();
}
// FOR FRAME BY FRAME TESTS -------------------------------------------- //
// document.addEventListener('keydown', function(event) {
//   if (event.code == 'KeyA') {
//     fbf()
//   }
// });
// function fbf() {
//   update(MSPERFRAME);
//   draw();
// }
// FUNCTION: init ------------------------------------------------------ //
function init() {
  activateStartBtn();
}
//FUNCTION mkStartBtn ------------------------------------------------- //
function activateStartBtn() {
  var startButton = document.getElementById("startButton");
  startButton.addEventListener("click", startPiece);
}
//FUNCTION play ------------------------------------------------------ //
function startPiece() {
  if (!played) {
    played = true;
    startButton.parentNode.removeChild(startButton);
    notes = loadInitialNotation();
    // initAudio();
    requestAnimationFrame(animationEngine);
  }
}
//FUNCTION loadInitialNotation ------------------------------------------------------ //
function loadInitialNotation() {
  var notesForEachPart = [];
  // pitchChanges = [] - [ time, frame, [ partsArrays ] ] - [ [b],[t],[a][s] ] - [ [b/t/a/s-1],[b/t/a/s-2],[b/t/a/s-3], [b/t/a/s-4] ] - [hz, midi, relAmp]
  for (var i = 0; i < 4; i++) {
    var notesDict = {};
    for (const [key, value] of Object.entries(notesMidiDict)) {
      var tnote = document.createElementNS(svgNS, "image");
      tnote.setAttributeNS(svgXlink, 'xlink:href', value);
      var tbb = pitchContainers[0].getBoundingClientRect();
      var tcontW = tbb.width;
      tnote.setAttributeNS(null, 'width', tcontW.toString());
      var tcontH = tbb.height;
      tnote.setAttributeNS(null, 'height', tcontH.toString());
      tnote.setAttributeNS(null, 'visibility', 'visible');
      notesDict[key] = tnote;
    }
    notesForEachPart.push(notesDict);
  }
  // DRAW INITIAL PITCHES FOR EACH TRACKS
  for (var i = 0; i < 4; i++) {
    var timg = notesForEachPart[0][roundByStep(pitchChanges[0][2][0][i][1], 0.5)];
    pitchContainerDOMs[i].appendChild(timg);
    currentNotation.push(timg);
  }
  for (var i = 4; i < 8; i++) {
    var j = i - 4;
    var timg = notesForEachPart[1][roundByStep(pitchChanges[0][2][1][j][1], 0.5)];
    pitchContainerDOMs[i].appendChild(timg);
    currentNotation.push(timg);
  }
  for (var i = 8; i < 12; i++) {
    var j = i - 8;
    var timg = notesForEachPart[2][roundByStep(pitchChanges[0][2][2][j][1], 0.5)];
    pitchContainerDOMs[i].appendChild(timg);
    currentNotation.push(timg);
  }
  for (var i = 12; i < 16; i++) {
    var j = i - 12;
    var timg = notesForEachPart[3][roundByStep(pitchChanges[0][2][3][j][1], 0.5)];
    pitchContainerDOMs[i].appendChild(timg);
    currentNotation.push(timg);
  }
  return notesForEachPart;
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
  //// SVG CONTAINERS ////
  for (var i = 0; i < numTracks; i++) {
    var tcont = document.getElementById("notationOuterDiv");
    var tsvgCanvas = document.createElementNS(svgNS, "svg");
    tsvgCanvas.setAttributeNS(null, "width", GOFRETWIDTH.toString());
    tsvgCanvas.setAttributeNS(null, "height", "100");
    tsvgCanvas.setAttributeNS(null, "id", "notationSVGcont" + i.toString());
    var trMargin = 34;
    var ttrgap = 20.3;
    var txloc = (ttrgap * i) + trMargin;
    tsvgCanvas.setAttributeNS(null, "transform", "translate(" + txloc.toString() + ", 0)");
    tsvgCanvas.setAttributeNS(null, "class", "notationCanvas");
    tsvgCanvas.style.backgroundColor = "white";
    tcont.appendChild(tsvgCanvas);
    pitchContainers.push(tsvgCanvas);
  }
  for (var i = 0; i < pitchContainers.length; i++) {
    pitchContainerDOMs.push(document.getElementById(pitchContainers[i].id));
  }
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
        goFretBlink[i] = framect + 9;
        scene.remove(scene.getObjectByName(eventMatrix[i][j][1].name));
      }
    }
  }
  // NOTATION //////////////////
  //REMOVE PREVIOUS NOTATION
  for (var i = 1; i < pitchChanges.length; i++) {
    if (pitchChanges[i][1] == framect) {
      for (var k = 0; k < 4; k++) {
        var timg = notes[0][roundByStep(pitchChanges[i][2][0][k][1], 0.5)];
        pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[0]);
      }
      for (var k = 4; k < 8; k++) {
        var j = k - 4;
        var timg = notes[1][roundByStep(pitchChanges[i][2][1][j][1], 0.5)];
        pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[0]);
      }
      for (var k = 8; k < 12; k++) {
        var j = k - 8;
        var timg = notes[2][roundByStep(pitchChanges[i][2][2][j][1], 0.5)];
        var tnotCont = document.getElementById(pitchContainers[k].id);
        pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[0]);
      }
      for (var k = 12; k < 16; k++) {
        var j = k - 12;
        var timg = notes[3][roundByStep(pitchChanges[i][2][3][j][1], 0.5)];
        var tnotCont = document.getElementById(pitchContainers[k].id);
        pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[0]);
      }
      break;
    }
  }
  //ADD NEW NOTATION
  for (var i = 1; i < pitchChanges.length; i++) {
    if (pitchChanges[i][1] == framect) {
      console.log("----------");
      console.log("----------");
      for (var k = 0; k < 4; k++) {
        console.log(roundByStep(pitchChanges[i][2][0][k][1], 0.5));
        var timg = notes[0][roundByStep(pitchChanges[i][2][0][k][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      for (var k = 4; k < 8; k++) {
        var j = k - 4;
        console.log(roundByStep(pitchChanges[i][2][1][j][1], 0.5));
        var timg = notes[1][roundByStep(pitchChanges[i][2][1][j][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      for (var k = 8; k < 12; k++) {
        var j = k - 8;
        console.log(roundByStep(pitchChanges[i][2][2][j][1], 0.5));
        var timg = notes[2][roundByStep(pitchChanges[i][2][2][j][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      for (var k = 12; k < 16; k++) {
        var j = k - 12;
        console.log(roundByStep(pitchChanges[i][2][3][j][1], 0.5));
        var timg = notes[3][roundByStep(pitchChanges[i][2][3][j][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      break;
    }
  }

}
// DRAW ----------------------------------------------------------------- //
function draw() {
  // // GO FRET BLINK TIMER ///////////////////////////////////
  for (var i = 0; i < goFretBlink.length; i++) {
    if (framect <= goFretBlink[i]) {
      goFrets[i][0].material.color = clr_safetyOrange;
      goFrets[i][0].geometry = goFretBigGeom;
    } else {
      goFrets[i][0].material.color = clr_neonGreen;
      goFrets[i][0].geometry = goFretGeom;
    }
  }
  // RENDER ///////////////////////////////////
  renderer.render(scene, camera);
}
// FUNCTION: mkEventSection ------------------------------------------- //
//FLATTEN EVENTS INTO ONE ARRAY PER PERFORMER
function mkEventMatrix() {
  var tEventMatrix = [];
  var tempoFretIx = 0;
  for (var i = 0; i < timeCodeByPart.length; i++) {
    var tTempoFretSet = [];
    for (var j = 0; j < timeCodeByPart[i].length; j++) {
      for (var k = 0; k < timeCodeByPart[i][j].length; k++) {
        var tTimeGopxGoFrm = [];
        var tTime = timeCodeByPart[i][j][k];
        tTime = tTime + leadTime;
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
