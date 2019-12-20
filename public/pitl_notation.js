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
var notationCanvasH = 100.0;
// MISC ////////////////////////////////////////
var played = false;
var currentPitches = [];
// CRESCENDOS //////////////////
var sec2eventMatrix;
var cresCrvCoords = plot(function(x) {
  return Math.pow(x, 3);
}, [0, 1, 0, 1], GOFRETWIDTH, notationCanvasH);
var cresSvgCrvs = [];
var cresCrvFollowers = [];
var cresCrvFollowersRect = [];
var sec3eventMatrixHocket, sec3eventMatrixCres, sec3eventMatrixAccel, sec4eventMatrix;
var sec2CresStart;
var mainVoiceAmp = 0.25;
// SET UP -------------------------------------------------------------- //
function setup() {
  createScene();
  eventMatrix = mkEventMatrixSec1();
  sec2eventMatrix = mkEventMatrixSec2();
  sec3eventMatrixHocket = mkEventMatrixSec3Hocket();
  sec3eventMatrixCres = mkEventMatrixSec3Cres();
  sec3eventMatrixAccel = mkEventMatrixSec3Accel();
  sec4eventMatrix = mkEventMatrixSec4();
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
//FUNCTION mkStartBtn ------------------------------------------------- //
function getCresStartTimes() {
  // Find Pitch Change before sec2start
  for (var i = 0; i < pitchChanges.length; i++) {
    if (sec2start < pitchChanges[i][0]) {
      sec2CresStart = pitchChanges[i][0];
      break;
    }
  }
}
//FUNCTION play ------------------------------------------------------ //
function startPiece() {
  if (!played) {
    played = true;
    startButton.parentNode.removeChild(startButton);
    notes = loadInitialNotation();
    // pieceClockAdjust(sec2start - 5);
    getCresStartTimes();
    initAudio();
    requestAnimationFrame(animationEngine);
  }
}
//FUNCTION initAudio ------------------------------------------------------ //
function initAudio() {
  actx = new(window.AudioContext || window.webkitAudioContext)();
  for (var i = 0; i < maxNumOfPlayers; i++) {
    var tgain = actx.createGain();
    tgain.gain.setValueAtTime(mainVoiceAmp, actx.currentTime);
    tgain.connect(actx.destination);
    cresGainNodes.push(tgain);
  }
}
//FUNCTION playsamp ------------------------------------------------------ //
function playsamp(path, rate, gainix) {
  var source = actx.createBufferSource();
  var request = new XMLHttpRequest();
  request.open('GET', path, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    actx.decodeAudioData(request.response, function(buffer) {
      source.buffer = buffer;
      cresGainNodes[gainix].gain.setValueAtTime(mainVoiceAmp, actx.currentTime);
      source.connect(cresGainNodes[gainix]);
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
    tsvgCanvas.setAttributeNS(null, "height", notationCanvasH.toString());
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
  // CURVE FOLLOW RECTS /////////////////////////////////////////////
  for (var j = 0; j < maxNumOfPlayers; j++) {
    var tcresFollowRect = document.createElementNS(svgNS, "rect");
    tcresFollowRect.setAttributeNS(null, "x", "0");
    tcresFollowRect.setAttributeNS(null, "y", "0");
    tcresFollowRect.setAttributeNS(null, "width", GOFRETWIDTH.toString());
    tcresFollowRect.setAttributeNS(null, "height", "0");
    tcresFollowRect.setAttributeNS(null, "fill", "rgba(255, 21, 160, 0.5)");
    tcresFollowRect.setAttributeNS(null, "id", "cresFollowRect" + j.toString());
    tcresFollowRect.setAttributeNS(null, "transform", "translate( 0, -3)");
    cresCrvFollowersRect.push(tcresFollowRect);
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
    tcresSvgCrv.setAttributeNS(null, "transform", "translate( 0, -3)");
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
    tcresSvgCirc.setAttributeNS(null, "transform", "translate( 0, -3)");
    cresCrvFollowers.push(tcresSvgCirc);
    //Make FOLLOWERS
    var tcrvFset = [];
    tcrvFset.push(true);
    tcrvFset.push(0.0);
    crvFollowData.push(tcrvFset);
  }
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
  //Sec 3
  //hocket
  for (var i = 0; i < sec3eventMatrixHocket.length; i++) {
    for (var j = 0; j < sec3eventMatrixHocket[i].length; j++) {
      sec3eventMatrixHocket[i][j][1].position.z += (tNewFrame * PXPERFRAME);
    }
  }
  //cres
  for (var i = 0; i < sec3eventMatrixCres.length; i++) {
    for (var j = 0; j < sec3eventMatrixCres[i].length; j++) {
      sec3eventMatrixCres[i][j][1].position.z += (tNewFrame * PXPERFRAME);
    }
  }
  //Accel
  for (var i = 0; i < sec3eventMatrixAccel.length; i++) {
    for (var j = 0; j < sec3eventMatrixAccel[i].length; j++) {
      sec3eventMatrixAccel[i][j][1].position.z += (tNewFrame * PXPERFRAME);
    }
  }
  //Section 4
  for (var i = 0; i < sec4eventMatrix.length; i++) {
    for (var j = 0; j < sec4eventMatrix[i].length; j++) {
      sec4eventMatrix[i][j][1].position.z += (tNewFrame * PXPERFRAME);
    }
  }
}
// UPDATE -------------------------------------------------------------- //
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
          playsamp(maleSamps[troundMidi.toString()], tspeed, i);
        } else { //female voices
          playsamp(femaleSamps[troundMidi.toString()], tspeed, i);
        }
      }
    }
  }
  ///// SECTION 2 ------------------------------------------------------- //
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
        goFretBlink[i] = framect + 9;
        crvFollowData[i][0] = true;
        crvFollowData[i][1] = scale(framect, sec2eventMatrix[i][j][2], sec2eventMatrix[i][j][6], 0.0, 1.0);
      }
      //// PLAY SAMPLES
      if (framect == sec2eventMatrix[i][j][2]) {
        // Play Samples
        var tactMidi = currentPitches[i];
        var troundMidi = limitRange(Math.round(tactMidi), 45, 81);
        var tspeed = midiToSpeed(troundMidi, tactMidi);
        if (i < 8) { //this is for male voices
          playsamp(maleSampsLong[troundMidi.toString()], tspeed, i);
        } else { //female voices
          playsamp(femaleSampsLong[troundMidi.toString()], tspeed, i);
        }
      }
      //end of event remove
      if (framect == sec2eventMatrix[i][j][6]) {
        crvFollowData[i][0] = false;
        scene.remove(scene.getObjectByName(sec2eventMatrix[i][j][1].name));
        cresGainNodes[i].gain.linearRampToValueAtTime(0.0, actx.currentTime + 0.5);
      }
    }
    //crv follow
    // var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
    if (crvFollowData[i][0]) {
      var tcoordsix = Math.floor(scale(crvFollowData[i][1], 0.0, 1.0, 0, cresCrvCoords.length));
      //circ
      cresCrvFollowers[i].setAttributeNS(null, "cx", cresCrvCoords[tcoordsix].x.toString());
      cresCrvFollowers[i].setAttributeNS(null, "cy", cresCrvCoords[tcoordsix].y.toString());
      //rect
      var temph = notationCanvasH - cresCrvCoords[tcoordsix].y;
      cresCrvFollowersRect[i].setAttributeNS(null, "y", cresCrvCoords[tcoordsix].y.toString());
      cresCrvFollowersRect[i].setAttributeNS(null, "height", temph.toString());
    }
  }
  // // // SECTION 3 - Hocket
  for (var i = 0; i < sec3eventMatrixHocket.length; i++) {
    for (var j = 0; j < sec3eventMatrixHocket[i].length; j++) {
      //add the tf to the scene if it is on the runway
      if (sec3eventMatrixHocket[i][j][1].position.z > (-RUNWAYLENGTH) && sec3eventMatrixHocket[i][j][1].position.z < GOFRETPOSZ) {

        if (sec3eventMatrixHocket[i][j][0]) {
          sec3eventMatrixHocket[i][j][0] = false;
          scene.add(sec3eventMatrixHocket[i][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (sec3eventMatrixHocket[i][j][1].position.z < GOFRETPOSZ) {
        sec3eventMatrixHocket[i][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == sec3eventMatrixHocket[i][j][2]) {
        goFretBlink[sec3HocketPlayers[i]] = framect + 9;
        scene.remove(scene.getObjectByName(sec3eventMatrixHocket[i][j][1].name));
        var tactMidi = currentPitches[sec3HocketPlayers[i]];
        var troundMidi = limitRange(Math.round(tactMidi), 45, 81);
        var tspeed = midiToSpeed(troundMidi, tactMidi);
        if (sec3HocketPlayers[i] < 8) { //this is for male voices
          playsamp(maleSamps[troundMidi.toString()], tspeed, sec3HocketPlayers[i]);
        } else { //female voices
          playsamp(femaleSamps[troundMidi.toString()], tspeed, sec3HocketPlayers[i]);
        }
      }
    }
  }
  ///// SECTION 3 - Cres ------------------------------------------------------- //
  for (var i = 0; i < sec3eventMatrixCres.length; i++) {
    for (var j = 0; j < sec3eventMatrixCres[i].length; j++) {
      //add the tf to the scene if it is on the runway
      if (sec3eventMatrixCres[i][j][1].position.z > (-RUNWAYLENGTH) && sec3eventMatrixCres[i][j][1].position.z < GOFRETPOSZ) {
        if (sec3eventMatrixCres[i][j][0]) {
          sec3eventMatrixCres[i][j][0] = false;
          scene.add(sec3eventMatrixCres[i][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (sec3eventMatrixCres[i][j][1].position.z < (GOFRETPOSZ + sec3eventMatrixCres[i][j][7])) {
        sec3eventMatrixCres[i][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect >= Math.round(sec3eventMatrixCres[i][j][2]) && framect < Math.round(sec3eventMatrixCres[i][j][6])) {
        goFretBlink[sec3Cres[i]] = framect + 9;
        crvFollowData[sec3Cres[i]][0] = true;
        crvFollowData[sec3Cres[i]][1] = scale(framect, sec3eventMatrixCres[i][j][2], sec3eventMatrixCres[i][j][6], 0.0, 1.0);
      }
      if (framect == Math.round(sec3eventMatrixCres[i][j][2])) {
        // Play Samples
        var tactMidi = currentPitches[sec3Cres[i]];
        var troundMidi = limitRange(Math.round(tactMidi), 45, 81);
        var tspeed = midiToSpeed(troundMidi, tactMidi);
        if (sec3Cres[i] < 8) { //this is for male voices
          playsamp(maleSampsLong[troundMidi.toString()], tspeed, sec3Cres[i]);
        } else { //female voices
          playsamp(femaleSampsLong[troundMidi.toString()], tspeed, sec3Cres[i]);
        }
      }
      //end of event remove
      if (framect == sec3eventMatrixCres[i][j][6]) {
        crvFollowData[sec3Cres[i]][0] = false;
        scene.remove(scene.getObjectByName(sec3eventMatrixCres[i][j][1].name));
        cresGainNodes[sec3Cres[i]].gain.linearRampToValueAtTime(0.0, actx.currentTime + 0.5);
      }
    }
    //crv follow
    // var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
    if (crvFollowData[sec3Cres[i]][0]) {
      var tcoordsix = Math.floor(scale(crvFollowData[sec3Cres[i]][1], 0.0, 1.0, 0, cresCrvCoords.length));
      //circ
      cresCrvFollowers[sec3Cres[i]].setAttributeNS(null, "cx", cresCrvCoords[tcoordsix].x.toString());
      cresCrvFollowers[sec3Cres[i]].setAttributeNS(null, "cy", cresCrvCoords[tcoordsix].y.toString());
      //rect
      var temph = notationCanvasH - cresCrvCoords[tcoordsix].y;
      cresCrvFollowersRect[sec3Cres[i]].setAttributeNS(null, "y", cresCrvCoords[tcoordsix].y.toString());
      cresCrvFollowersRect[sec3Cres[i]].setAttributeNS(null, "height", temph.toString());
    }
  }

  // // // SECTION 3 - Accel
  for (var i = 0; i < sec3eventMatrixAccel.length; i++) {
    for (var j = 0; j < sec3eventMatrixAccel[i].length; j++) {
      //add the tf to the scene if it is on the runway
      if (sec3eventMatrixAccel[i][j][1].position.z > (-RUNWAYLENGTH) && sec3eventMatrixAccel[i][j][1].position.z < GOFRETPOSZ) {

        if (sec3eventMatrixAccel[i][j][0]) {
          sec3eventMatrixAccel[i][j][0] = false;
          scene.add(sec3eventMatrixAccel[i][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (sec3eventMatrixAccel[i][j][1].position.z < GOFRETPOSZ) {
        sec3eventMatrixAccel[i][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == sec3eventMatrixAccel[i][j][2]) {
        goFretBlink[sec3Accel[i]] = framect + 9;
        scene.remove(scene.getObjectByName(sec3eventMatrixAccel[i][j][1].name));
        var tactMidi = currentPitches[sec3Accel[i]];
        var troundMidi = limitRange(Math.round(tactMidi), 45, 81);
        var tspeed = midiToSpeed(troundMidi, tactMidi);
        if (sec3Accel[i] < 8) { //this is for male voices
          playsamp(maleSamps[troundMidi.toString()], tspeed, sec3Accel[i]);
        } else { //female voices
          playsamp(femaleSamps[troundMidi.toString()], tspeed, sec3Accel[i]);
        }
      }
    }
  }

  // // // SECTION 4
  for (var i = 0; i < sec4eventMatrix.length; i++) {
    for (var j = 0; j < sec4eventMatrix[i].length; j++) {
      //add the tf to the scene if it is on the runway
      if (sec4eventMatrix[i][j][1].position.z > (-RUNWAYLENGTH) && sec4eventMatrix[i][j][1].position.z < GOFRETPOSZ) {
        if (sec4eventMatrix[i][j][0]) {
          sec4eventMatrix[i][j][0] = false;
          scene.add(sec4eventMatrix[i][j][1]);
        }
      }
      //advance tf if it is not past gofret
      if (sec4eventMatrix[i][j][1].position.z < GOFRETPOSZ) {
        sec4eventMatrix[i][j][1].position.z += PXPERFRAME;
      }
      //When tf reaches goline, blink and remove
      if (framect == sec4eventMatrix[i][j][2]) {
        goFretBlink[i] = framect + 9;
        scene.remove(scene.getObjectByName(sec4eventMatrix[i][j][1].name));
        var tactMidi = currentPitches[i];
        var troundMidi = limitRange(Math.round(tactMidi), 45, 81);
        var tspeed = midiToSpeed(troundMidi, tactMidi);
        if (i < 8) { //this is for male voices
          playsamp(maleSamps[troundMidi.toString()], tspeed, i);
        } else { //female voices
          playsamp(femaleSamps[troundMidi.toString()], tspeed, i);
        }
      }
    }
  }
  // NOTATION --------------------------------------------------------- //
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

      // ADD CURVES /////
      //find pitch change before section 2
      if (drwCrvFollow) {
        for (var i = 0; i < pitchContainerDOMs.length; i++) {
          pitchContainerDOMs[i].appendChild(cresSvgCrvs[i]);
          pitchContainerDOMs[i].appendChild(cresCrvFollowers[i]);
          pitchContainerDOMs[i].appendChild(cresCrvFollowersRect[i]);
        }
      }
      //find pitch change before section 2
      if (drwCrvFollowsec3) {
        for (var i = 0; i < sec3Cres.length; i++) {
          pitchContainerDOMs[sec3Cres[i]].appendChild(cresSvgCrvs[sec3Cres[i]]);
          pitchContainerDOMs[sec3Cres[i]].appendChild(cresCrvFollowers[sec3Cres[i]]);
          pitchContainerDOMs[sec3Cres[i]].appendChild(cresCrvFollowersRect[sec3Cres[i]]);
        }
      }
      break;
    }
  }
  //Draw crv followers only when needed
  if (framect == (Math.round(sec2start * FRAMERATE) + (leadTime * FRAMERATE))) {
    drwCrvFollow = true;
    for (var i = 0; i < pitchContainerDOMs.length; i++) {
      pitchContainerDOMs[i].appendChild(cresSvgCrvs[i]);
      pitchContainerDOMs[i].appendChild(cresCrvFollowers[i]);
      pitchContainerDOMs[i].appendChild(cresCrvFollowersRect[i]);
    }
  }
  //Remove at end of section 2
  if (framect == (Math.round(endSec2Time * FRAMERATE) + (leadTime * FRAMERATE))) {
    drwCrvFollow = false;
    for (var i = 0; i < cresSvgCrvs.length; i++) {
      document.getElementById(cresSvgCrvs[i].id).remove();
    }
    for (var i = 0; i < cresCrvFollowers.length; i++) {
      document.getElementById(cresCrvFollowers[i].id).remove();
    }
    for (var i = 0; i < cresCrvFollowersRect.length; i++) {
      document.getElementById(cresCrvFollowersRect[i].id).remove();
    }

  }

  //SECTION 3 CURVE FOLLOWERS
  if (framect == (Math.round(sec3StartTime * FRAMERATE) + (leadTime * FRAMERATE))) {
    drwCrvFollowsec3 = true;
    for (var i = 0; i < sec3Cres.length; i++) {
      pitchContainerDOMs[sec3Cres[i]].appendChild(cresSvgCrvs[sec3Cres[i]]);
      pitchContainerDOMs[sec3Cres[i]].appendChild(cresCrvFollowers[sec3Cres[i]]);
      pitchContainerDOMs[sec3Cres[i]].appendChild(cresCrvFollowersRect[sec3Cres[i]]);
    }
  }
  //Remove at end of section 3
  if (framect == (Math.round(sec3EndTime * FRAMERATE) + (leadTime * FRAMERATE))) {
    drwCrvFollowsec3 = false;
    for (var i = 0; i < sec3Cres.length; i++) {
      document.getElementById(cresSvgCrvs[sec3Cres[i]].id).remove();
      document.getElementById(cresCrvFollowers[sec3Cres[i]].id).remove();
      document.getElementById(cresCrvFollowersRect[sec3Cres[i]].id).remove();
    }
  }
}

var drwCrvFollow = false;
var drwCrvFollowsec3 = false;
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
      tcresEventMesh.position.z = tiGoPx - (tcresEventLength / 2.0);
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
// FUNCTION: mkEventMatrixSec3 ------------------------------------------- //
function mkEventMatrixSec3Hocket() {
  var tEventMatrix = [];
  var tempoFretIx = 0;
  for (var i = 0; i < sec3HocketTimeCode.length; i++) {
    var tTempoFretSet = [];
    for (var j = 0; j < sec3HocketTimeCode[i].length; j++) {
      for (var k = 0; k < sec3HocketTimeCode[i][j].length; k++) {
        var tTimeGopxGoFrm = [];
        var tTime = sec3HocketTimeCode[i][j][k];
        tTime = tTime + leadTime;
        var tNumPxTilGo = tTime * PXPERSEC;
        var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
        var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
        var tempMatl = new THREE.MeshLambertMaterial({
          color: fretClr[j % 2]
        });
        var tempSec3HocketFret = new THREE.Mesh(tempoFretGeom, tempMatl);
        tempSec3HocketFret.position.z = tiGoPx;
        tempSec3HocketFret.position.y = GOFRETHEIGHT;
        tempSec3HocketFret.position.x = -trackXoffset + (spaceBtwnTracks * sec3HocketPlayers[i]);
        tempSec3HocketFret.name = "tempofret" + tempoFretIx;
        tempoFretIx++;
        var tnewTempoFret = [true, tempSec3HocketFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
        tTempoFretSet.push(tnewTempoFret);
      }
    }
    tEventMatrix.push(tTempoFretSet);
  }
  return tEventMatrix;
}
// FUNCTION: mkEventSection ------------------------------------------- //
function mkEventMatrixSec3Cres() {
  var tEventMatrix = [];
  var teventMeshIx = 0;
  for (var i = 0; i < sec3CresTimeCodeByPart.length; i++) {
    var tcresEventSet = [];
    for (var j = 0; j < sec3CresTimeCodeByPart[i].length; j++) {
      var tTimeGopxGoFrm = [];
      var tTime = sec3CresTimeCodeByPart[i][j];
      tTime = tTime + leadTime;
      var tNumPxTilGo = tTime * PXPERSEC;
      var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
      var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
      var tempMatl = new THREE.MeshLambertMaterial({
        color: fretClr[j % 2]
      });
      var tcresEventLength = cresDurs[sec3Cres[i]] * PXPERSEC;
      var teventdurframes = Math.round(cresDurs[sec3Cres[i]] * FRAMERATE);
      var tOffFrm = tGoFrm + teventdurframes;
      var tcresEventGeom = new THREE.CubeGeometry(50, GOFRETHEIGHT + 5, tcresEventLength);
      var tcresEventMesh = new THREE.Mesh(tcresEventGeom, tempMatl);
      tcresEventMesh.position.z = tiGoPx - (tcresEventLength / 2.0);
      tcresEventMesh.position.y = GOFRETHEIGHT;
      tcresEventMesh.position.x = -trackXoffset + (spaceBtwnTracks * sec3Cres[i]);
      tcresEventMesh.name = "sec3CresEvent" + teventMeshIx;
      teventMeshIx++;
      var tnewCresEvent = [true, tcresEventMesh, tGoFrm, tTime, tNumPxTilGo, tiGoPx, tOffFrm, tcresEventLength]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      tcresEventSet.push(tnewCresEvent);
    }
    tEventMatrix.push(tcresEventSet);
  }
  return tEventMatrix;
}
// FUNCTION: mkEventMatrixSec3 ------------------------------------------- //
function mkEventMatrixSec3Accel() {
  var tEventMatrix = [];
  var tempoFretIx = 0;
  for (var i = 0; i < sec3AccelTimeCode.length; i++) {
    var tTempoFretSet = [];
    for (var j = 0; j < sec3AccelTimeCode[i].length; j++) {
      for (var k = 0; k < sec3AccelTimeCode[i][j].length; k++) {
        var tTimeGopxGoFrm = [];
        var tTime = sec3AccelTimeCode[i][j][k];
        tTime = tTime + leadTime;
        var tNumPxTilGo = tTime * PXPERSEC;
        var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
        var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
        var tempMatl = new THREE.MeshLambertMaterial({
          color: fretClr[j % 2]
        });
        var tempSec3HocketFret = new THREE.Mesh(tempoFretGeom, tempMatl);
        tempSec3HocketFret.position.z = tiGoPx;
        tempSec3HocketFret.position.y = GOFRETHEIGHT;
        tempSec3HocketFret.position.x = -trackXoffset + (spaceBtwnTracks * sec3Accel[i]);
        tempSec3HocketFret.name = "sec3AccelFret" + tempoFretIx;
        tempoFretIx++;
        var tnewTempoFret = [true, tempSec3HocketFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
        tTempoFretSet.push(tnewTempoFret);
      }
    }
    tEventMatrix.push(tTempoFretSet);
  }
  return tEventMatrix;
}
// FUNCTION: mkEventMatrixSec4 ------------------------------------------- //
function mkEventMatrixSec4() {
  var tEventMatrix = [];
  var tempoFretIx = 0;
  for (var i = 0; i < sec4TimeCode.length; i++) {
    var tTempoFretSet = [];
    for (var j = 0; j < sec4TimeCode[i].length; j++) {
      var tTimeGopxGoFrm = [];
      var tTime = sec4TimeCode[i][j];
      tTime = tTime + leadTime;
      var tNumPxTilGo = tTime * PXPERSEC;
      var tiGoPx = GOFRETPOSZ - tNumPxTilGo;
      var tGoFrm = Math.round(tNumPxTilGo / PXPERFRAME);
      var tempMatl = new THREE.MeshLambertMaterial({
        color: fretClr[0]
      });
      var tempSec3HocketFret = new THREE.Mesh(tempoFretGeom, tempMatl);
      tempSec3HocketFret.position.z = tiGoPx;
      tempSec3HocketFret.position.y = GOFRETHEIGHT;
      tempSec3HocketFret.position.x = -trackXoffset + (spaceBtwnTracks * i);
      tempSec3HocketFret.name = "sec4Fret" + tempoFretIx;
      tempoFretIx++;
      var tnewTempoFret = [true, tempSec3HocketFret, tGoFrm, tTime, tNumPxTilGo, tiGoPx]; //[gate so tempofret is added to scene only once, mesh, goFrame]
      tTempoFretSet.push(tnewTempoFret);

    }
    tEventMatrix.push(tTempoFretSet);
  }
  return tEventMatrix;
}
// MORE VARIABLES ------------------------------------------------------ //
var cresGainNodes = [];
var maleSamps = {
  45: '/samples/voice_samples_m/45.wav',
  46: '/samples/voice_samples_m/46.wav',
  47: '/samples/voice_samples_m/47.wav',
  48: '/samples/voice_samples_m/48.wav',
  49: '/samples/voice_samples_m/49.wav',
  50: '/samples/voice_samples_m/50.wav',
  51: '/samples/voice_samples_m/51.wav',
  52: '/samples/voice_samples_m/52.wav',
  53: '/samples/voice_samples_m/53.wav',
  54: '/samples/voice_samples_m/54.wav',
  55: '/samples/voice_samples_m/55.wav',
  56: '/samples/voice_samples_m/56.wav',
  57: '/samples/voice_samples_m/57.wav',
  58: '/samples/voice_samples_m/58.wav',
  59: '/samples/voice_samples_m/59.wav',
  60: '/samples/voice_samples_m/60.wav',
  61: '/samples/voice_samples_m/61.wav',
  62: '/samples/voice_samples_m/62.wav',
  63: '/samples/voice_samples_m/63.wav',
  64: '/samples/voice_samples_m/64.wav'
}

var femaleSamps = {
  57: '/samples/voice_samples_f/57.wav',
  58: '/samples/voice_samples_f/58.wav',
  59: '/samples/voice_samples_f/59.wav',
  60: '/samples/voice_samples_f/60.wav',
  61: '/samples/voice_samples_f/61.wav',
  62: '/samples/voice_samples_f/62.wav',
  63: '/samples/voice_samples_f/63.wav',
  64: '/samples/voice_samples_f/64.wav',
  65: '/samples/voice_samples_f/65.wav',
  66: '/samples/voice_samples_f/66.wav',
  67: '/samples/voice_samples_f/67.wav',
  68: '/samples/voice_samples_f/68.wav',
  69: '/samples/voice_samples_f/69.wav',
  70: '/samples/voice_samples_f/70.wav',
  71: '/samples/voice_samples_f/71.wav',
  72: '/samples/voice_samples_f/72.wav',
  73: '/samples/voice_samples_f/73.wav',
  74: '/samples/voice_samples_f/74.wav',
  75: '/samples/voice_samples_f/75.wav',
  76: '/samples/voice_samples_f/76.wav',
  77: '/samples/voice_samples_f/77.wav',
  78: '/samples/voice_samples_f/78.wav',
  79: '/samples/voice_samples_f/79.wav',
  80: '/samples/voice_samples_f/80.wav',
  81: '/samples/voice_samples_f/81.wav'
}

var maleSampsLong = {
  45: '/samples/voice_samples_long_m/45.wav',
  46: '/samples/voice_samples_long_m/46.wav',
  47: '/samples/voice_samples_long_m/47.wav',
  48: '/samples/voice_samples_long_m/48.wav',
  49: '/samples/voice_samples_long_m/49.wav',
  50: '/samples/voice_samples_long_m/50.wav',
  51: '/samples/voice_samples_long_m/51.wav',
  52: '/samples/voice_samples_long_m/52.wav',
  53: '/samples/voice_samples_long_m/53.wav',
  54: '/samples/voice_samples_long_m/54.wav',
  55: '/samples/voice_samples_long_m/55.wav',
  56: '/samples/voice_samples_long_m/56.wav',
  57: '/samples/voice_samples_long_m/57.wav',
  58: '/samples/voice_samples_long_m/58.wav',
  59: '/samples/voice_samples_long_m/59.wav',
  60: '/samples/voice_samples_long_m/60.wav',
  61: '/samples/voice_samples_long_m/61.wav',
  62: '/samples/voice_samples_long_m/62.wav',
  63: '/samples/voice_samples_long_m/63.wav',
  64: '/samples/voice_samples_long_m/64.wav'
}

var femaleSampsLong = {
  57: '/samples/voice_samples_long_f/57.wav',
  58: '/samples/voice_samples_long_f/58.wav',
  59: '/samples/voice_samples_long_f/59.wav',
  60: '/samples/voice_samples_long_f/60.wav',
  61: '/samples/voice_samples_long_f/61.wav',
  62: '/samples/voice_samples_long_f/62.wav',
  63: '/samples/voice_samples_long_f/63.wav',
  64: '/samples/voice_samples_long_f/64.wav',
  65: '/samples/voice_samples_long_f/65.wav',
  66: '/samples/voice_samples_long_f/66.wav',
  67: '/samples/voice_samples_long_f/67.wav',
  68: '/samples/voice_samples_long_f/68.wav',
  69: '/samples/voice_samples_long_f/69.wav',
  70: '/samples/voice_samples_long_f/70.wav',
  71: '/samples/voice_samples_long_f/71.wav',
  72: '/samples/voice_samples_long_f/72.wav',
  73: '/samples/voice_samples_long_f/73.wav',
  74: '/samples/voice_samples_long_f/74.wav',
  75: '/samples/voice_samples_long_f/75.wav',
  76: '/samples/voice_samples_long_f/76.wav',
  77: '/samples/voice_samples_long_f/77.wav',
  78: '/samples/voice_samples_long_f/78.wav',
  79: '/samples/voice_samples_long_f/79.wav',
  80: '/samples/voice_samples_long_f/80.wav',
  81: '/samples/voice_samples_long_f/81.wav'
}
