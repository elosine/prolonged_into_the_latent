var actx, src, analyser, dataArray, binsize;

document.addEventListener('keydown', function(event) {
  if (event.code == 'Space') {
    initAudio();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.code == 'KeyP') {
    playSamp();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.code == 'KeyA') {
    getFreqData();
  }
});


function getFreqData() {
  analyser.getFloatFrequencyData(dataArray);
  var indices = findIndicesOfMax(dataArray, 16);
  var freqMidiAmps = [];
  for(var i=0;i<indices.length;i++){
    freqMidiAmps.push( [ indices[i]*binsize, ftom(indices[i]*binsize), dataArray[ indices[i] ] ] );
  }
  //sort 16 pitches from lowest to highest
  //convert bottom 4 to bass range, next 4 to tenor etc
  var parts = [[],[],[],[]];
  for(var i=0;i<freqMidiAmps.length;i++){
    if(freqMidiAmps[i][1] >= 36)
  }
  console.log(freqMidiAmps);
}

function realSplice(items, ix) {
  const filteredItems = items.slice(0, ix).concat(items.slice(ix + 1, items.length));
  return filteredItems;
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
  sfrequest.open('GET', '/samples/FullmanFluctuations3.wav', true);
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
