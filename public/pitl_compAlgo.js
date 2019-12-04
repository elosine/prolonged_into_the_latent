var leadTime = 8.0;

//ca 10.6 - 13.2 min
var PIECEDURSEC = rrand(10.6, 13.2) * 60;
// 5 Sections: Hocket - Crescendos - Hocket/Crescendos/Accel - Hocket/Accel - Short Hocket :13-:27
var sectionsSecs = [];
//Section 1: Hocket 17-24%
var section1dur = PIECEDURSEC * rrand(0.33, 0.38);
//Section 6: Short Hocket :13-:27
var section5dur = rrand(13, 27);
//Section 2: Crescendos 37-39% of what is left
var s2thru4 = PIECEDURSEC - section1dur - section5dur;
var section2dur = s2thru4 * rrand(0.39, 0.43);
//Section 3: Hocket/Crescendos/Accel 57-63% of what is left
var s3_4 = s2thru4 - section2dur;
var section3dur = s3_4 * rrand(0.57, 0.63);
//Section 3: Accel & Hocket what remains
var section4dur = s3_4 - section3dur;
//Section 1 Tempo Changes
var sec1TempoChanges = palindromeTimeContainers(section1dur, 2.4, 9, 0.03, 0.06);
//For every tempo change how many simultaneous tempi
// 1, 2, 3, 4, 5, 7, 11, 12
var numSimultaneousTempi = [1, 2, 3, 4, 5, 7, 11, 12];
var tempiChances = [21, 17, 11, 11, 8, 7, 4, 4];
var sec1NumTempi = [];
for (var i = 0; i < sec1TempoChanges.length; i++) {
  var time_numTempi = [];
  time_numTempi.push(sec1TempoChanges[i]);
  var numTempi = chooseWeighted(numSimultaneousTempi, tempiChances);
  time_numTempi.push(numTempi);
  sec1NumTempi.push(time_numTempi);
}
//For every tempo change choose tempi
var sec1Tempi = [];
//Generate divisions approx ever 5bpm
var tempoMin = 54;
var tempoMax = 91;
var newTempo = tempoMin;
var tempoSects = [];
while (newTempo <= tempoMax) {
  tempoSects.push(newTempo);
  newTempo = newTempo + rrand(4.1, 5.7);
}
var tempi = [];
//generate 3 tempi per section
for (var i = 1; i < tempoSects.length; i++) {
  var tempTempoSec = [];
  for (var j = 0; j < 3; j++) {
    var nextTempo = rrand(tempoSects[i - 1], tempoSects[i]);
    //generate a random phase
    var tempo_phase = [];
    tempo_phase.push(nextTempo);
    var phase = rrand(0, 1);
    tempo_phase.push(phase);
    tempTempoSec.push(tempo_phase);
  }
  tempi.push(tempTempoSec);
}
//shuffle tempo array
var tempiShuffle = shuffle(tempi);
var tempoArrayInc = 0;
//grab a tempo from each section
for (var i = 0; i < sec1NumTempi.length; i++) {
  var tempSecTempi = [];
  for (var j = 0; j < sec1NumTempi[i][1]; j++) {
    var thisTempo = choose(tempiShuffle[tempoArrayInc]);
    tempoArrayInc = (tempoArrayInc + 1) % tempiShuffle.length;
    tempSecTempi.push(thisTempo);
  }
  var timecode_tempi = [];
  timecode_tempi.push(sec1NumTempi[i][0]);
  timecode_tempi.push(tempSecTempi);
  sec1Tempi.push(timecode_tempi);
}
//Generate a timegrid for every beat
// sec1Tempi[i][0] is the time code start for that section
//sec1Tempi[1] = an array of tempi;
var timeGrid = [];
for (var i = 1; i < sec1Tempi.length; i++) {
  var thisSectionTimes = [];
  thisSectionTimes.push(sec1Tempi[i - 1][0]);
  var tempTempoTimes = [];
  for (var j = 0; j < sec1Tempi[i][1].length; j++) {
    var tCurrTime = sec1Tempi[i - 1][0];
    //find #sec/beat
    var temptempo = sec1Tempi[i][1][j][0];
    var tempphase = sec1Tempi[i][1][j][1];
    var secperbeat = 60.0 / temptempo; //tempo, [1] is phase
    var durTil1stBeat = secperbeat * tempphase;
    tCurrTime = tCurrTime + durTil1stBeat;
    var thisTempoTimes = [];
    while (tCurrTime <= sec1Tempi[i][0]) {
      // while (tCurrTime <= (sec1Tempi[i][0]-secperbeat)) {
      thisTempoTimes.push(tCurrTime);
      tCurrTime = tCurrTime + secperbeat;
      // thisTempoTimes.push(tCurrTime);
    }
    var tempArraySet = [];
    tempArraySet.push(thisTempoTimes);
    var emptyOrchArray = [];
    tempArraySet.push(emptyOrchArray);
    tempArraySet.unshift(sec1Tempi[i][1][j]);
    tempTempoTimes.push(tempArraySet);

  }
  thisSectionTimes.push(tempTempoTimes);
  timeGrid.push(thisSectionTimes);
}


// Orchestration

// Generate a large set of every player we will need for every section
var maxNumOfPlayers = 16;
var totalNumPlayers = 0;
var playerGrid = [];
var playerGridIx = 0;
//Generate large grid of 16 players for each section
for (var i = 0; i < timeGrid.length; i++) {
  for (var j = 0; j < maxNumOfPlayers; j++) {
    playerGrid.push(j);
  }
}
//Generate the number of players for each section
//Grab sequencially from  master player grid and scramble
for (var i = 0; i < timeGrid.length; i++) {
  //number players this section
  var tNumPlayersThisSection = rrandInt(timeGrid[i][1].length, maxNumOfPlayers);
  //Store for later use
  timeGrid[i].push(tNumPlayersThisSection);
  //Generate set of players for this sec
  var tsecPlayersSet = [];
  var tsecPlayersSetIx = 0;
  for (var j = 0; j < tNumPlayersThisSection; j++) {
    tsecPlayersSet.push(playerGrid[playerGridIx]);
    playerGridIx++;
  }
  //Even number of players for each part
  //Randomly distribute remainders
  var tNumParts = timeGrid[i][1].length;
  var tNumRepeats = Math.floor(tNumPlayersThisSection / timeGrid[i][1].length);
  var tRemainderPlayers = tNumPlayersThisSection % timeGrid[i][1].length;
  for (var j = 0; j < tNumRepeats; j++) {
    for (var k = 0; k < timeGrid[i][1].length; k++) {
      timeGrid[i][1][k][2].push(tsecPlayersSet[tsecPlayersSetIx]);
      tsecPlayersSetIx++;
    }
  }
  //With remainder players, randomly assign to one of the parts
  var tscramParts = scrambleCount(timeGrid[i][1].length);
  for (var j = 0; j < tRemainderPlayers; j++) {
    timeGrid[i][1][tscramParts[j]][2].push(tsecPlayersSet[tsecPlayersSetIx]);
    tsecPlayersSetIx++;
  }
}


/*
timegrid:
[0] Section Start timecode
[1] Arrays of Timecode for Each Tempo
    [0] ... One Array for Every Tempo
        [0] [Tempo in BPM, Phase]
        [1] [Array of Timecode for each beat]
        [2] [Array of Players]
[2] Number of Players
*/
/* NEXT
New Array organize playerGrid by player
Generate pitch changes with the palindromeTimeContainers function
Write algorithm to insert pitches for each beat per players
Flag beats with pitch change
*/

/*
Player will be index Number
Each Array of time codes as an entry in array
*/
//Search for Player number
var timeCodeByPart = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  []
];
for (var i = 0; i < timeGrid.length; i++) {
  for (var j = 0; j < timeGrid[i][1].length; j++) {
    for (var k = 0; k < timeGrid[i][1][j][2].length; k++) {
      timeCodeByPart[timeGrid[i][1][j][2][k]].push(timeGrid[i][1][j][1]);
    }
  }
}
//MAKE PITCH DATA
var pitchChangeTimes = palindromeTimeContainers(PIECEDURSEC, 7, 21, 0.01, 0.17);
//Fetch Pitches From Fullman Analysis
var pitchChanges = [];
fetch('/pitchdata/sfAnalysis001.txt')
  .then(response => response.text())
  .then(text => {
    var pitchesArray1 = [];
    var pitchesArray2;
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
      pitchesArray1.push(t3);
    }
    //slice off first 10 entries because they do not have full pitches for all parts
    pitchesArray2 = pitchesArray1.slice(10, pitchesArray1.length);
    return pitchesArray2;
  })
  .then(valArr => {
    // pitchesArray is index for each second
    // 4 arrays for every section: bass, tenor, alto, soprano
    // Each section array contains up to 4 pitches for each of 4 singers
    // [hz, midi, relative Amp]
    var pitchesArrayMaxTime = valArr.length - 1;
    var pitchChangeTimesMaxTime = pitchChangeTimes[pitchChangeTimes.length - 1];
    for (var i = 0; i < pitchChangeTimes.length; i++) {
      var ttimepartsarr = [];
      var ttimecode;
      if (i != 0) {
        ttimecode = leadTime + pitchChangeTimes[i];
      } else ttimecode = 0.0;
      ttimepartsarr.push(ttimecode);
      ttimepartsarr.push(Math.round(ttimecode * FRAMERATE));
      var tScaledTime = scale(pitchChangeTimes[i], 0.0, pitchChangeTimesMaxTime, 0.0, pitchesArrayMaxTime);
      for (var j = 0; j < valArr.length; j++) {
        if (tScaledTime < j) {
          ttimepartsarr.push(valArr[j - 1]);
          pitchChanges.push(ttimepartsarr);
          break;
        }
      }
    }
  });
  //MAKE DICTIONARY OF PITCH NOTATION BY MIDI NOTE NUMBER AND PATH STRING









///
