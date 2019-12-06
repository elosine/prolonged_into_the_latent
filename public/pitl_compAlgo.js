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
fetch('/pitchdata/sfAalysis003.txt')
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
    return pitchesArray1;
  })
  .then(valArr => {
    //All parts need to have 4 pitches per section
    //this will remove the ones that do not have full sections
    var ttoosmall = [];
    var tnewPitchesArray = [];
    for (var i = 0; i < valArr.length; i++) {
      for (var j = 0; j < valArr[i].length; j++) {
        if (valArr[i][j].length < 4) {
          ttoosmall.push(i);
        }
      }
    }
    for (var i = 0; i < valArr.length; i++) {
      var tallGood = true;
      for (var j = 0; j < ttoosmall.length; j++) {
        if (i == ttoosmall[j]) {
          tallGood = false;
          break;
        }
      }
      if (tallGood) tnewPitchesArray.push(valArr[i]);
    }
    // SHUFFLE UP PITCHES
    var ts = [];
    for(var i=0;i<tnewPitchesArray.length;i++){
      ts.push(i);
    }
    var tss = shuffle(ts);
    var tnewPitchesArray2 = [];
    for(var i=0;i<tnewPitchesArray.length;i++){
      tnewPitchesArray2.push( tnewPitchesArray[ tss[i] ] );
    }
    // pitchesArray is index for each second
    // 4 arrays for every section: bass, tenor, alto, soprano
    // Each section array contains up to 4 pitches for each of 4 singers
    // [hz, midi, relative Amp]
    var pitchesArrayMaxTime = tnewPitchesArray2.length - 1;
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
      for (var j = 0; j < tnewPitchesArray2.length; j++) {
        if (tScaledTime < j) {
          ttimepartsarr.push(tnewPitchesArray2[j - 1]);
          pitchChanges.push(ttimepartsarr);
          break;
        }
      }
    }
  });
//MAKE DICTIONARY OF PITCH NOTATION BY MIDI NOTE NUMBER AND PATH STRING
var notesMidiDict = {
  36: '/svgs/036c2.svg',
  36.5: '/svgs/036p5cqs2.svg',
  37.0: '/svgs/037cs2.svg',
  37.5: '/svgs/037p5dqf2.svg',
  38.0: '/svgs/038d2.svg',
  38.5: '/svgs/038p5dqs2.svg',
  39.0: '/svgs/039ds2.svg',
  39.5: '/svgs/039p5eqf2.svg',
  40.0: '/svgs/040e2.svg',
  40.5: '/svgs/040p5fqf2.svg',
  41.0: '/svgs/041f2.svg',
  41.5: '/svgs/041p5fqs2.svg',
  42.0: '/svgs/042fs2.svg',
  42.5: '/svgs/042p5gqf2.svg',
  43.0: '/svgs/043g2.svg',
  43.5: '/svgs/043p5gqs2.svg',
  44.0: '/svgs/044gs2.svg',
  44.5: '/svgs/044p5aqf2.svg',
  45.0: '/svgs/045a2.svg',
  45.5: '/svgs/045p5aqs2.svg',
  46.0: '/svgs/046bf2.svg',
  46.5: '/svgs/046p5bqf2.svg',
  47.0: '/svgs/047b2.svg',
  47.5: '/svgs/047p5cqf3.svg',
  48.0: '/svgs/048c3.svg',
  48.5: '/svgs/048p5cqs3.svg',
  49.0: '/svgs/049cs3.svg',
  49.5: '/svgs/049p5dqf3.svg',
  50.0: '/svgs/050d3.svg',
  50.5: '/svgs/050p5dqs3.svg',
  51.0: '/svgs/051ef3.svg',
  51.5: '/svgs/051p5eqf3.svg',
  52.0: '/svgs/052e3.svg',
  52.5: '/svgs/052p5fqf3.svg',
  53.0: '/svgs/053f3.svg',
  53.5: '/svgs/053p5fqs3.svg',
  54.0: '/svgs/054fs3.svg',
  54.5: '/svgs/054p5gqf3.svg',
  55.0: '/svgs/055g3.svg',
  55.5: '/svgs/055p5gqs3.svg',
  56.0: '/svgs/056gs3.svg',
  56.5: '/svgs/056p5aqf3.svg',
  57.0: '/svgs/057a3.svg',
  57.5: '/svgs/057p5aqs3.svg',
  58.0: '/svgs/058bf3.svg',
  58.5: '/svgs/058p5bqf3.svg',
  59.0: '/svgs/059b3.svg',
  59.5: '/svgt/059p5cqb4t.svg',
  60.0: '/svgt/060c4t.svg',
  60.5: '/svgt/060p5cqs4t.svg',
  61.0: '/svgt/061cs4t.svg',
  61.5: '/svgs/061p5dqf4.svg',
  62.0: '/svgs/062d4.svg',
  62.5: '/svgs/062p5dqs4.svg',
  63.0: '/svgs/063ef4.svg',
  63.5: '/svgs/063p5eqf4.svg',
  64.0: '/svgs/064e4.svg',
  64.5: '/svgs/064p5fqf4.svg',
  65.0: '/svgs/065f4.svg',
  65.5: '/svgs/065p5fqs4.svg',
  66.0: '/svgs/066fs4.svg',
  66.5: '/svgs/066p5gqf4.svg',
  67.0: '/svgs/067g4.svg',
  67.5: '/svgs/067p5gqs4.svg',
  68.0: '/svgs/068gs4.svg',
  68.5: '/svgs/068p5aqf4.svg',
  69.0: '/svgs/069a4.svg',
  69.5: '/svgs/069p5aqs4.svg',
  70.0: '/svgs/070bf4.svg',
  70.5: '/svgs/070p5bqf4.svg',
  71.0: '/svgs/071b4.svg',
  71.5: '/svgs/071p5cqf5.svg',
  72.0: '/svgs/072c5.svg',
  72.5: '/svgs/072p5cqs5.svg',
  73.0: '/svgs/073cs5.svg',
  73.5: '/svgs/073p5dqf5.svg',
  74.0: '/svgs/074d5.svg',
  74.5: '/svgs/074p5dqs5.svg',
  75.0: '/svgs/075ef5.svg',
  75.5: '/svgs/075p5eqf5.svg',
  76.0: '/svgs/076e5.svg',
  76.5: '/svgs/076p5fqf5.svg',
  77.0: '/svgs/077f5.svg',
  77.5: '/svgs/077p5fqs5.svg',
  78.0: '/svgs/078fs5.svg',
  78.5: '/svgs/078p5gqf5.svg',
  79.0: '/svgs/079g5.svg',
  79.5: '/svgs/079p5gqs5.svg',
  80.0: '/svgs/080gs5.svg',
  80.5: '/svgs/080p5aqf5.svg',
  81.0: '/svgs/081a5.svg'
}
for (const [key, value] of Object.entries(notesMidiDict)) {}







///
