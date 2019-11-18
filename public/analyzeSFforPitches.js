var actx, src, analyser, dataArray, binsize;
//Initiate Sequence ctrl+option+shift-l
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.altKey && event.shiftKey && event.code == 'KeyL') {
    initAudio();
    playSamp();
    go = true;
    newtime = actx.currentTime + 1;
  }
});

//Loop to get frequency data every second
var sfDur = 30;
var go = false;
var downloadgate = true;
var pitchset = [];
window.setInterval(() => {
  if (go) {
    if (actx.currentTime <= sfDur) {
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

function arrayToString3D(arr) {
  var tempstr = "";
  for (var i = 0; i < arr.length; i++) {
    var tempstr1 = "";
    for (var j = 0; j < arr[i].length; j++) {
      var tempstr2 = "";
      for (var k = 0; k < arr[i][j].length; k++) {
        if (k == 0) {
          tempstr2 = arr[i][j][k].toString();
        } else {
          tempstr2 = tempstr2 + "&" + arr[i][j][k].toString();
        }
      }
      if (j == 0) {
        tempstr1 = tempstr2;
      } else {
        tempstr1 = tempstr1 + ";" + tempstr2;
      }
    }
    if (i == 0) {
      tempstr = tempstr1;
    } else {
      tempstr = tempstr + ":" + tempstr1;
    }
  }
  return tempstr;
}

function downloadstringtofile() {
  if (downloadgate) {
    var tempstrarr = arrayToString3D(pitchset);
    download(tempstrarr, 'sfAalysis001.txt', 'text/plain');
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
      [36, 64],
      [48, 69],
      [53, 74],
      [60, 84]
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

//use like this: array.sort(sortFunction2DArray)
function sortFunction2DArray(a, b) {
  if (a[0] === b[0]) {
    return 0;
  } else {
    //change a[0] < b[0] to a[1] < b[1] to sort by second column etc
    return (a[0] < b[0]) ? -1 : 1;
  }
}

function findIndicesOfMax(inp, count) {
  var outp = [];
  for (var i = 0; i < inp.length; i++) {
    outp.push(i); // add index to output array
    if (outp.length > count) {
      outp.sort(function(a, b) {
        return inp[b] - inp[a];
      }); // descending sort the output array
      outp.pop(); // remove the last index (index of smallest element in output array)
    }
  }
  return outp;
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

// download('the content of the file', 'filename.txt', 'text/plain');
function download(strData, strFileName, strMimeType) {
  var D = document,
    A = arguments,
    a = D.createElement("a"),
    d = A[0],
    n = A[1],
    t = A[2] || "text/plain";

  //build download link:
  a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);

  if (window.MSBlobBuilder) { // IE10
    var bb = new MSBlobBuilder();
    bb.append(strData);
    return navigator.msSaveBlob(bb, strFileName);
  } /* end if(window.MSBlobBuilder) */

  if ('download' in a) { //FF20, CH19
    a.setAttribute("download", n);
    a.innerHTML = "downloading...";
    D.body.appendChild(a);
    setTimeout(function() {
      var e = D.createEvent("MouseEvents");
      e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      a.dispatchEvent(e);
      D.body.removeChild(a);
    }, 66);
    return true;
  }; /* end if('download' in a) */

  //do iframe dataURL download: (older W3)
  var f = D.createElement("iframe");
  D.body.appendChild(f);
  f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
  setTimeout(function() {
    D.body.removeChild(f);
  }, 333);
  return true;
}
