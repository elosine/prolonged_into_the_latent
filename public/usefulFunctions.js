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
// FUNCTION: chooseWeighted -----------------------------------
function chooseWeighted(items, chances) {
  var sum = chances.reduce((acc, el) => acc + el, 0);
  var acc = 0;
  chances = chances.map(el => (acc = el + acc));
  var rand = Math.random() * sum;
  return items[chances.filter(el => el <= rand).length];
}
// FUNCTION: palindromeTimeContainers -----------------------------------
function palindromeTimeContainers(dur, minval, maxval, pctmin, pctmax) {
  var timeCont = [];
  var currtime = 0;
  var newdur = dur;
  var newminval = minval;
  while (newdur > (dur / 2)) {
    var tc = newminval;
    timeCont.push(currtime);
    currtime = currtime + tc;
    newdur = newdur - tc;
    newminval = Math.min((newminval * (1 + rrand(pctmin, pctmax))), maxval);
  }
  while (newdur >= 0) {
    var tc = newminval;
    timeCont.push(currtime);
    currtime = currtime + tc;
    newdur = newdur - tc;
    newminval = Math.max((newminval * (1 - rrand(pctmin, pctmax))), minval);
  }
  return timeCont;
}
// FUNCTION: array3dtoString -----------------------------------
function array3dtoString(arr) {
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
// FUNCTION: sortFunction2DArray -----------------------------------
//use like this: array.sort(sortFunction2DArray)
function sortFunction2DArray(a, b) {
  if (a[0] === b[0]) {
    return 0;
  } else {
    //change a[0] < b[0] to a[1] < b[1] to sort by second column etc
    return (a[0] < b[0]) ? -1 : 1;
  }
}
// FUNCTION: findIndicesOfMax -----------------------------------
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
// FUNCTION: downloadStrToHD -----------------------------------
// download('the content of the file', 'filename.txt', 'text/plain');
function downloadStrToHD(strData, strFileName, strMimeType) {
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
