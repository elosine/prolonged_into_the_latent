//ca 10.6 - 13.2 min
var PIECEDURSEC = rrand(10.6, 13.2)*60;
// 6 Sections: Hocket - Crescendos - Hocket/Crescendos/Accel - Hocket/Accel - Short Hocket :13-:27
var sectionsSecs = [];
//Section 1: Hocket 17-24%
var section1dur = PIECEDURSEC*rrand(0.33, 0.38);
//Section 6: Short Hocket :13-:27
var section4dur = rrand(13, 27);
//Section 2: Crescendos 42-53% of what is left
var s2and3 = PIECEDURSEC - section1dur - section4dur;
var section2dur = s2and3 * rrand(0.38, 0.42);
//Section 3: Accel & Hocket what remains
var section3dur = s2and3 - section2dur;
console.log("s1:" + (section1dur/60) + " " + "s2:" + (section2dur/60) +
" " + "s3:" + (section3dur/60) + " " + "s4:" + (section4dur/60)  );
