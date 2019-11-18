var actx;
var oscs = [];
var gains = [];
// FUNCTION: initAudio ---------------------------------------------------- //
function initAudio() {
  actx = new(window.AudioContext || window.webkitAudioContext)();
  for (var i = 0; i < 16; i++) {
    var temposc = actx.createOscillator();
    var tempgain = actx.createGain();
    temposc.frequency.setValueAtTime(440, actx.currentTime);
    tempgain.gain.setValueAtTime(0, actx.currentTime);
    temposc.start();
    temposc.connect(tempgain);
    tempgain.connect(actx.destination);
    oscs.push(temposc);
    gains.push(tempgain);
  }
  go = true;
}

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.altKey && event.shiftKey && event.code == 'KeyP') {
    initAudio();
  }
});
//Loop
var go = false;
var dur = 5 * 60;
var ct = 0;
window.setInterval(() => {

  if (go) {
    if (actx.currentTime < dur) {
      console.log("Stage-" + ct + " time: " + actx.currentTime);
      ct++;
      for (var i = 0; i < gains.length; i++) {
        gains[i].gain.linearRampToValueAtTime(0, actx.currentTime + 0.2);
      }
      var pitchIdx = Math.floor(scale(actx.currentTime, 0, dur, 0, pitchesArray.length));
      for (var i = 0; i < pitchesArray[pitchIdx][0].length; i++) {
        var tempnewfreq = parseFloat(pitchesArray[pitchIdx][0][i][0]);
        if (isFinite(tempnewfreq)) {
          oscs[i].frequency.setValueAtTime(parseFloat(pitchesArray[pitchIdx][0][i][0]), actx.currentTime + 0.3);
          gains[i].gain.setTargetAtTime(0.07, actx.currentTime + 0.4, 0.2);
        }
      }
      for (var i = 0; i < pitchesArray[pitchIdx][1].length; i++) {
        var tempnewfreq = parseFloat(pitchesArray[pitchIdx][1][i][0]);
        if (isFinite(tempnewfreq)) {
          oscs[i + 4].frequency.setValueAtTime(parseFloat(pitchesArray[pitchIdx][1][i][0]), actx.currentTime + 0.3);
          gains[i + 4].gain.setTargetAtTime(0.07, actx.currentTime + 0.4, 0.2);
        }
      }
      for (var i = 0; i < pitchesArray[pitchIdx][2].length; i++) {
        var tempnewfreq = parseFloat(pitchesArray[pitchIdx][2][i][0]);
        if (isFinite(tempnewfreq)) {
          oscs[i + 8].frequency.setValueAtTime(parseFloat(pitchesArray[pitchIdx][2][i][0]), actx.currentTime + 0.3);
          gains[i + 8].gain.setTargetAtTime(0.07, actx.currentTime + 0.4, 0.2);
        }
      }
      for (var i = 0; i < pitchesArray[pitchIdx][3].length; i++) {
        var tempnewfreq = parseFloat(pitchesArray[pitchIdx][3][i][0]);
        if (isFinite(tempnewfreq)) {
          oscs[i + 12].frequency.setValueAtTime(parseFloat(pitchesArray[pitchIdx][3][i][0]), actx.currentTime + 0.3);
          gains[i + 12].gain.setTargetAtTime(0.07, actx.currentTime + 0.4, 0.2);
        }
      }
    }
  }

}, 3000);


var pitchesArray = [];
fetch('/pitchdata/sfAnalysis001.txt')
  .then(response => response.text())
  .then(text => {
    var t1 = text.split(":");
    for (var i = 0; i < t1.length; i++) {
      var temparr = t1[i].split(';');
      var t3 = [];
      for (var j = 0; j < temparr.length; j++) {
        var temparr2 = temparr[j].split("&");
        var t4 = [];
        for (var k = 0; k < temparr2.length; k++) {
          t4.push(temparr2[k].split(","));
        }
        t3.push(t4);
      }
      pitchesArray.push(t3);
    }
  });
