var actx, src, analyser, dataArray, binsize;
//Initiate Sequence ctrl+option+shift-l
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.altKey && event.shiftKey && event.code == 'KeyL') {
    console.log("Real-time pitch acquisition begun...");
    initAudio();
    playSamp();
    go = true;
    newtime = actx.currentTime + 1;
  }
});

//Loop to get frequency data every second
var sfDur = 444;
var go = false;
var downloadgate = true;
var pitchset = [];
window.setInterval(() => {
  if (go) {
    if (actx.currentTime <= sfDur) {
      console.log("Countdown: " + (sfDur-actx.currentTime));
      var tempset = getFreqData();
      if (tempset != null) {
        pitchset.push(tempset);
      } else {
      }
    } else {
      go = false;
      downloadstringtofile();
    }
  }
}, 1000);

function downloadstringtofile() {
  if (downloadgate) {
    var tempstrarr = array3dtoString(pitchset);
    downloadStrToHD(tempstrarr, 'sfAalysis003.txt', 'text/plain');
    downloadgate = false;
  }
}

function getFreqData() {
  var tempdataArray = [];
  analyser.getFloatFrequencyData(dataArray);
  for (var i = 0; i < dataArray.length; i++) {
    if (isFinite(dataArray[i])) {
      tempdataArray.push(dataArray[i]);
    }
  }
  if (tempdataArray.length > 63) {
    var indices = findIndicesOfMax(tempdataArray, 64);
    var freqMidiAmps = [];
    for (var i = 0; i < indices.length; i++) {
      freqMidiAmps.push([indices[i] * binsize, ftom(indices[i] * binsize), tempdataArray[indices[i]]]);
    }
    //sort all pitches from lowest to highest
    //convert bottom 4 to bass range, next 4 to tenor etc
    var freqMidiAmps_sorted = freqMidiAmps.sort(sortFunction2DArray);
    var parts = [];
    var ranges = [
      [40, 60],
      [48, 67],
      [53, 74],
      [60, 81]
    ];
    //sort into parts, if analyzed pitches do not fit into range
    //find closest 8ve
    function getNotesForPart(startCount, endCount, rangeLow, rangeHi) {
      var tempbassnotes = [];
      for (var i = startCount; i < endCount; i++) {
        var pitchtranspose = freqMidiAmps_sorted[i][1];
        if (pitchtranspose < rangeLow) {
          var octiveTranspose = Math.ceil((rangeLow - pitchtranspose) / 12);
          pitchtranspose = pitchtranspose + (12 * octiveTranspose);
        } else if (freqMidiAmps_sorted[i][1] > rangeHi) {
          var octiveTranspose = Math.ceil((pitchtranspose - rangeHi) / 12);
          pitchtranspose = pitchtranspose - (12 * octiveTranspose);
        }
        var tempnewfreq = mtof(pitchtranspose);
        var tempamp = freqMidiAmps_sorted[i][2];
        tempbassnotes.push([tempnewfreq, pitchtranspose, tempamp]);
      }
      var tempbassnotes_sorted = tempbassnotes.sort(sortFunction2DArray);
      //Check to see if pitches are too close together and pick 4
      var tempfinalbass = [tempbassnotes_sorted[0]];
      for (var i = 1; i < tempbassnotes_sorted.length; i++) {
        if (tempbassnotes_sorted[i][1] > (tempbassnotes_sorted[i - 1][1] + 0.5)) {
          if (tempfinalbass.length < 4) {
            tempfinalbass.push(tempbassnotes_sorted[i]);
          }
        }
      }
      return tempfinalbass;
    }
    parts.push(getNotesForPart(0, 16, ranges[0][0], ranges[0][1]));
    parts.push(getNotesForPart(16, 32, ranges[1][0], ranges[1][1]));
    parts.push(getNotesForPart(32, 48, ranges[2][0], ranges[2][1]));
    parts.push(getNotesForPart(48, 64, ranges[3][0], ranges[3][1]));
    return parts;
  } else {
    return null;
  }
}

function initAudio() {
  actx = new(window.AudioContext || window.webkitAudioContext)();
  analyser = actx.createAnalyser();
  var fftsize = 32768;
  analyser.fftSize = fftsize;
  binsize = actx.sampleRate / fftsize;
  var bufferLength = analyser.frequencyBinCount;
  dataArray = new Float32Array(bufferLength);
}

function playSamp() {
  src = actx.createBufferSource();
  src.connect(analyser);
  var sfrequest = new XMLHttpRequest();
  sfrequest.open('GET', '/samples/FullmanFluctuations3_edit.wav', true);
  // sfrequest.open('GET', '/samples/ifItoldhim.wav', true);
  sfrequest.responseType = 'arraybuffer';
  sfrequest.onload = function() {
    actx.decodeAudioData(sfrequest.response, function(buffer) {
      src.buffer = buffer;
      src.start(1);
    }, function(e) {
      console.log('Audio error! ', e);
    });
  }
  sfrequest.send();
}
