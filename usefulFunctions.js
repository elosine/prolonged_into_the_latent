// FUNCTION: clamp ---------------------------------------------- //
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}
// FUNCTION: mtof -------------------------------------------------- //
function mtof(midinote) {
  var freq;
  freq = Math.pow(2, ((midinote - 69) / 12)) * 440;
  return freq;
}
// FUNCTION: ftom -------------------------------------------------- //
function ftom(freq) {
  var midi;
  midi = (Math.log2((freq / 440)) * 12) + 69;
  return midi;
}
// FUNCTION: rrand ------------------------------------------------- //
function rrand(min, max) {
  return Math.random() * (max - min) + min;
}
// FUNCTION: rrandInt ---------------------------------------------- //
function rrandInt(min, max) {
  var tmin = min - 0.4999999;
  var tmax = max + 0.4999999;
  return Math.round(Math.random() * (tmax - tmin) + tmin);
}
// FUNCTION: rrandInt ---------------------------------------------- //
function rrandIntFloor(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
// FUNCTION: rrand ------------------------------------------------- //
function choose(tempSet) {
  var randpick = rrandIntFloor(0, tempSet.length);
  return tempSet[randpick];
}
// FUNCTION: scale -------------------------------------------------- //
const scale = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
// FUNCTION: norm -------------------------------------------------- //
const norm = (num, in_min, in_max) => {
  return (num - in_min) * (1.0 - 0.0) / (in_max - in_min);
}
// FUNCTION: shuffle ------------------------------------------------ //
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
