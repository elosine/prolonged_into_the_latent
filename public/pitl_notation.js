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
var currentPitches = [];
// CRESCENDOS //////////////////
var sec2eventMatrix;
var cresCrvCoords = plot(function(x) {
  return Math.pow(x, 3);
}, [0, 1, 0, 1], GOFRETWIDTH, 100);
var cresSvgCrvs = [];
var cresCrvFollowers = [];
// SET UP -------------------------------------------------------------- //
function setup() {
  createScene();
  eventMatrix = mkEventMatrixSec1();
  sec2eventMatrix = mkEventMatrixSec2();
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
    pieceClockAdjust(sec2start - 5);
    initAudio();
    requestAnimationFrame(animationEngine);
  }
}
//FUNCTION initAudio ------------------------------------------------------ //
function initAudio() {
  actx = new(window.AudioContext || window.webkitAudioContext)();
}
//FUNCTION playsamp ------------------------------------------------------ //
function playsamp(path, rate) {
  var source = actx.createBufferSource();
  var request = new XMLHttpRequest();
  request.open('GET', path, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    actx.decodeAudioData(request.response, function(buffer) {
      source.buffer = buffer;
      source.connect(actx.destination);
      source.loop = false;
      source.playbackRate.value = rate;
      source.start();
    }, function(e) {
      console.log('Audio error! ', e);
    });
  }
  request.send();
}
//FUNCTION loadInitialNotation ------------------------------------------------------ //
// var ranges = [[40, 60],[48, 67],[53, 74],[60, 81]];
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
    currentPitches.push(parseFloat(pitchChanges[0][2][0][i][1]));
  }
  for (var i = 4; i < 8; i++) {
    var j = i - 4;
    var timg = notesForEachPart[1][roundByStep(pitchChanges[0][2][1][j][1], 0.5)];
    pitchContainerDOMs[i].appendChild(timg);
    currentPitches.push(parseFloat(pitchChanges[0][2][1][j][1]));
  }
  for (var i = 8; i < 12; i++) {
    var j = i - 8;
    var timg = notesForEachPart[2][roundByStep(pitchChanges[0][2][2][j][1], 0.5)];
    pitchContainerDOMs[i].appendChild(timg);
    currentPitches.push(parseFloat(pitchChanges[0][2][2][j][1]));
  }
  for (var i = 12; i < 16; i++) {
    var j = i - 12;
    var timg = notesForEachPart[3][roundByStep(pitchChanges[0][2][3][j][1], 0.5)];
    pitchContainerDOMs[i].appendChild(timg);
    currentPitches.push(parseFloat(pitchChanges[0][2][3][j][1]));
  }
  return notesForEachPart;
}
// FUNCTION: createScene ---------------------------------------------- //
function createScene() {
  // Camera ////////////////////////////////
  camera = new THREE.PerspectiveCamera(75, CANVASW / CANVASH, 1, 3000);
  camera.position.set(0, 560, -148);
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
  //// CURVES ////
  for (var j = 0; j < maxNumOfPlayers; j++) {
    var tcresSvgCrv = document.createElementNS(svgNS, "path");
    var tpathstr = "";
    for (var i = 0; i < cresCrvCoords.length; i++) {
      if (i == 0) {
        tpathstr = tpathstr + "M" + cresCrvCoords[i].x.toString() + " " + cresCrvCoords[i].y.toString() + " ";
      } else {
        tpathstr = tpathstr + "L" + cresCrvCoords[i].x.toString() + " " + cresCrvCoords[i].y.toString() + " ";
      }
    }
    tcresSvgCrv.setAttributeNS(null, "d", tpathstr);
    tcresSvgCrv.setAttributeNS(null, "stroke", "rgba(255, 21, 160, 0.5)");
    tcresSvgCrv.setAttributeNS(null, "stroke-width", "4");
    tcresSvgCrv.setAttributeNS(null, "fill", "none");
    tcresSvgCrv.setAttributeNS(null, "id", "cresCrv" + j.toString());
    cresSvgCrvs.push(tcresSvgCrv);
  }
  // CURVE FOLLOWERS
  for (var j = 0; j < maxNumOfPlayers; j++) {
    var tcresSvgCirc = document.createElementNS(svgNS, "circle");
    tcresSvgCirc.setAttributeNS(null, "cx", cresCrvCoords[0].x.toString());
    tcresSvgCirc.setAttributeNS(null, "cy", cresCrvCoords[0].y.toString());
    tcresSvgCirc.setAttributeNS(null, "r", "10");
    tcresSvgCirc.setAttributeNS(null, "stroke", "none");
    tcresSvgCirc.setAttributeNS(null, "fill", "rgba(255, 21, 160, 0.5)");
    tcresSvgCirc.setAttributeNS(null, "id", "cresCrvCirc" + j.toString());
    cresCrvFollowers.push(tcresSvgCirc);
    //Make FOLLOWERS
    var tcrvFset = [];
    tcrvFset.push(true);
    tcrvFset.push(0.0);
    crvFollowData.push(tcrvFset);
  }
  pitchContainerDOMs[0].appendChild(cresSvgCrvs[0]);
  pitchContainerDOMs[0].appendChild(cresCrvFollowers[0]);
  // RENDER /////////////////////////////////////////////
  renderer.render(scene, camera);
}
var crvFollowData = [];
// FUNCTION: animationEngine -------------------------------------------- //
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
//work out how to start later on in the piece
function pieceClockAdjust(time) {
  var tNewFrame = (time + leadTime) * FRAMERATE;
    // var tNewFrame = time * FRAMERATE;
  framect = Math.round(tNewFrame);
  //Sec 1
  for (var i = 0; i < eventMatrix.length; i++) {
    for (var j = 0; j < eventMatrix[i].length; j++) {
      //move each event
      eventMatrix[i][j][1].position.z += (tNewFrame * PXPERFRAME);
    }
  }
  //Sec 2
  for (var i = 0; i < sec2eventMatrix.length; i++) {
    for (var j = 0; j < sec2eventMatrix[i].length; j++) {
      //move each event
      sec2eventMatrix[i][j][1].position.z += (tNewFrame * PXPERFRAME);
    }
  }
}
// UPDATE -------------------------------------------------------------- //
var tt = true;

function update(aMSPERFRAME) {
  // CLOCK ///////////////////////////////////////////////
  framect++;
  pieceClock += aMSPERFRAME;
  pieceClock = pieceClock - clockadj;
  // // EVENTS /////////////////////////////////////////////////////
  // // // SECTION 1
  for (var i = 0; i < eventMatrix.length; i++) {
    for (var j = 0; j < eventMatrix[i].length; j++) {
      //add the tf to the scene if it is on the runway
      if (eventMatrix[i][j][1].position.z > (-RUNWAYLENGTH) && eventMatrix[i][j][1].position.z < GOFRETPOSZ) {
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
        var tactMidi = currentPitches[i];
        var troundMidi = limitRange(Math.round(tactMidi), 45, 81);
        var tspeed = midiToSpeed(troundMidi, tactMidi);
        if (i < 8) { //this is for male voices
          playsamp(maleSamps[troundMidi.toString()], tspeed);
        } else { //female voices
          playsamp(femaleSamps[troundMidi.toString()], tspeed);
        }
      }
    }
  }
  // // // SECTION 2
  for (var i = 0; i < sec2eventMatrix.length; i++) {
    for (var j = 0; j < sec2eventMatrix[i].length; j++) {
      //add the tf to the scene if it is on the runway
      if (sec2eventMatrix[i][j][1].position.z > (-RUNWAYLENGTH) && sec2eventMatrix[i][j][1].position.z < GOFRETPOSZ) {
        if (sec2eventMatrix[i][j][0]) {
          sec2eventMatrix[i][j][0] = false;
          scene.add(sec2eventMatrix[i][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (sec2eventMatrix[i][j][1].position.z < (GOFRETPOSZ + sec2eventMatrix[i][j][7])) {
        sec2eventMatrix[i][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect >= sec2eventMatrix[i][j][2] && framect < sec2eventMatrix[i][j][6]) {
        crvFollowData[i][0] = true;
        crvFollowData[i][1] = scale(framect, sec2eventMatrix[i][j][2], sec2eventMatrix[i][j][6], 0.0, 1.0);
        // Play Samples
        // var tactMidi = currentPitches[i];
        // var troundMidi = limitRange(Math.round(tactMidi), 45, 81);
        // var tspeed = midiToSpeed(troundMidi, tactMidi);
        // if (i < 8) { //this is for male voices
        //   playsamp(maleSamps[troundMidi.toString()], tspeed);
        // } else { //female voices
        //   playsamp(femaleSamps[troundMidi.toString()], tspeed);
        // }
      }
      //end of event remove
      if (framect == sec2eventMatrix[i][j][6]) {
        crvFollowData[i][0] = false;
        scene.remove(scene.getObjectByName(sec2eventMatrix[i][j][1].name));

      }
    }

    //crv follow
    // var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]

    if (crvFollowData[i][0]) {
      var tcoordsix = Math.floor(scale(crvFollowData[i][1], 0.0, 1.0, 0, cresCrvCoords.length));
      cresCrvFollowers[i].setAttributeNS(null, "cx", cresCrvCoords[tcoordsix].x.toString());
      cresCrvFollowers[i].setAttributeNS(null, "cy", cresCrvCoords[tcoordsix].y.toString());
    }
  }
  // NOTATION //////////////////
  //REMOVE PREVIOUS NOTATION
  for (var i = 1; i < pitchChanges.length; i++) {
    if (pitchChanges[i][1] == framect) {
      for (var k = 0; k < 4; k++) {
        var timg = notes[0][roundByStep(pitchChanges[i][2][0][k][1], 0.5)];
        for (var l = 0; l < pitchContainerDOMs[k].children.length; l++) {
          pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[l]);
        }
        currentPitches[k] = parseFloat(pitchChanges[i][2][0][k][1]);
      }
      for (var k = 4; k < 8; k++) {
        var j = k - 4;
        var timg = notes[1][roundByStep(pitchChanges[i][2][1][j][1], 0.5)];
        for (var l = 0; l < pitchContainerDOMs[k].children.length; l++) {
          pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[l]);
        }
        currentPitches[k] = parseFloat(pitchChanges[i][2][1][j][1]);
      }
      for (var k = 8; k < 12; k++) {
        var j = k - 8;
        var timg = notes[2][roundByStep(pitchChanges[i][2][2][j][1], 0.5)];
        var tnotCont = document.getElementById(pitchContainers[k].id);
        for (var l = 0; l < pitchContainerDOMs[k].children.length; l++) {
          pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[l]);
        }
        currentPitches[k] = parseFloat(pitchChanges[i][2][2][j][1]);
      }
      for (var k = 12; k < 16; k++) {
        var j = k - 12;
        var timg = notes[3][roundByStep(pitchChanges[i][2][3][j][1], 0.5)];
        var tnotCont = document.getElementById(pitchContainers[k].id);
        for (var l = 0; l < pitchContainerDOMs[k].children.length; l++) {
          pitchContainerDOMs[k].removeChild(pitchContainerDOMs[k].children[l]);
        }
        currentPitches[k] = parseFloat(pitchChanges[i][2][3][j][1]);
      }
      break;
    }
  }
  //ADD NEW NOTATION
  for (var i = 1; i < pitchChanges.length; i++) {
    if (pitchChanges[i][1] == framect) {
      for (var k = 0; k < 4; k++) {
        var timg = notes[0][roundByStep(pitchChanges[i][2][0][k][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      for (var k = 4; k < 8; k++) {
        var j = k - 4;
        var timg = notes[1][roundByStep(pitchChanges[i][2][1][j][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      for (var k = 8; k < 12; k++) {
        var j = k - 8;
        var timg = notes[2][roundByStep(pitchChanges[i][2][2][j][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      for (var k = 12; k < 16; k++) {
        var j = k - 12;
        var timg = notes[3][roundByStep(pitchChanges[i][2][3][j][1], 0.5)];
        pitchContainerDOMs[k].appendChild(timg);
      }
      break;
    }
  }
  // ADD CURVES /////
  if (framect > (sec2start * FRAMERATE)) {
    for (var i = 0; i < pitchContainerDOMs.length; i++) {
      pitchContainerDOMs[i].appendChild(cresSvgCrvs[i]);
      pitchContainerDOMs[i].appendChild(cresCrvFollowers[i]);
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
function mkEventMatrixSec1() {
  var tEventMatrix = [];
  var tempoFretIx = 0;
  for (var i = 0; i < timeCodeByPart.length; i++) {
    var tTempoFretSet = [];
    for (var j = 0; j < timeCodeByPart[i].length; j++) {
      for (var k = 0; k < timeCodeByPart[i][j].length; k++) {
        var tTimeGopxGoFrm = [];
        var tTime = timeCodeByPart[i][j][k];
        tTime = tTime + leadTime;
        // tTime = tTime ;
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
//FLATTEN EVENTS INTO ONE ARRAY PER PERFORMER
function mkEventMatrixSec2() {
  var tEventMatrix = [];
  var teventMeshIx = 0;
  for (var i = 0; i < sec2TimeCodeByPart.length; i++) {
    var tcresEventSet = [];
    for (var j = 0; j < sec2TimeCodeByPart[i].length; j++) {
      var tTimeGopxGoFrm = [];
      var tTime = sec2TimeCodeByPart[i][j];
      tTime = tTime + leadTime;
      // tTime = tTime;
      var tNumPxTilGo = tTime * PXPERSEC;
      var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
      var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
      var tempMatl = new THREE.MeshLambertMaterial({
        color: fretClr[j % 2]
      });
      var tcresEventLength = cresDurs[i] * PXPERSEC;
      var teventdurframes = Math.round(cresDurs[i] * FRAMERATE);
      var tOffFrm = tGoFrm + teventdurframes;
      var tcresEventGeom = new THREE.CubeGeometry(50, GOFRETHEIGHT + 5, tcresEventLength);
      var tcresEventMesh = new THREE.Mesh(tcresEventGeom, tempMatl);
      tcresEventMesh.position.z = tiGoPx;
      tcresEventMesh.position.y = GOFRETHEIGHT;
      tcresEventMesh.position.x = -trackXoffset + (spaceBtwnTracks * i);
      tcresEventMesh.name = "cresEvent" + teventMeshIx;
      teventMeshIx++;
      var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      tcresEventSet.push(tnewCresEvent);
    }
    tEventMatrix.push(tcresEventSet);
  }
  return tEventMatrix;
}

// MORE VARIABLES ------------------------------------------------------ //
var maleSamps = {
  45: '/samples/voices_m/45_A2_m.wav',
  46: '/samples/voices_m/46_As2_m.wav',
  47: '/samples/voices_m/47_B2_m.wav',
  48: '/samples/voices_m/48_C3_m.wav',
  49: '/samples/voices_m/49_Cs3_m.wav',
  50: '/samples/voices_m/50_D3_m.wav',
  51: '/samples/voices_m/51_Ds3_m.wav',
  52: '/samples/voices_m/52_E3_m.wav',
  53: '/samples/voices_m/53_F3_m.wav',
  54: '/samples/voices_m/54_Fs3_m.wav',
  55: '/samples/voices_m/55_G3_m.wav',
  56: '/samples/voices_m/56_Gs3_m.wav',
  57: '/samples/voices_m/57_A3_m.wav',
  58: '/samples/voices_m/58_As3_m.wav',
  59: '/samples/voices_m/59_B3_m.wav',
  60: '/samples/voices_m/60_C4_m.wav',
  61: '/samples/voices_m/61_Cs4_m.wav',
  62: '/samples/voices_m/62_D4_m.wav',
  63: '/samples/voices_m/63_Ds4_m.wav',
  64: '/samples/voices_m/64_E4_m.wav'
}

var femaleSamps = {
  57: '/samples/voices_f/57_A3_f.wav',
  58: '/samples/voices_f/58_As3_f.wav',
  59: '/samples/voices_f/59_B3_f.wav',
  60: '/samples/voices_f/60_C3_f.wav',
  61: '/samples/voices_f/61_Cs3_f.wav',
  62: '/samples/voices_f/62_D3_f.wav',
  63: '/samples/voices_f/63_Ds3_f.wav',
  64: '/samples/voices_f/64_E4_f.wav',
  65: '/samples/voices_f/65_F4_f.wav',
  66: '/samples/voices_f/66_Fs4_f.wav',
  67: '/samples/voices_f/67_G4_f.wav',
  68: '/samples/voices_f/68_Gs4_f.wav',
  69: '/samples/voices_f/69_A4_f.wav',
  70: '/samples/voices_f/70_As4_f.wav',
  71: '/samples/voices_f/71_B4_f.wav',
  72: '/samples/voices_f/72_C5_f.wav',
  73: '/samples/voices_f/73_Cs5_f.wav',
  74: '/samples/voices_f/74_D5_f.wav',
  75: '/samples/voices_f/75_Ds5_f.wav',
  76: '/samples/voices_f/76_E5_f.wav',
  77: '/samples/voices_f/77_F5_f.wav',
  78: '/samples/voices_f/78_Fs5_f.wav',
  79: '/samples/voices_f/79_G5_f.wav',
  80: '/samples/voices_f/80_Gs5_f.wav',
  81: '/samples/voices_f/81_A5_f.wav'
}
