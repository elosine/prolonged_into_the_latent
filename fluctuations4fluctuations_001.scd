(
s.options.memSize = 1000000;
s.waitForBoot{ fork{
//groups
s.sendMsg("/g_new", 4997, 3, 1);
10.do{|ix| s.sendMsg("/g_new", 4998+ix, 3, 4997+ix )};
//load main buffer
~f3 = Buffer.read(s, thisProcess.nowExecutingPath.dirname ++ "/FullmanFluctuations3.aif");
~envs = SoundFile.collectIntoBuffers( thisProcess.nowExecutingPath.dirname ++ "/grainEnv/*" );
//buf read synthdef
SynthDef(\mainidx, {
	arg buf, rate=1, obs;
	var sig;
	sig = Phasor.ar(0, BufRateScale.kr(buf)*rate, 0, BufFrames.kr(buf));
	Out.ar(obs, sig);
}).add;
~durmin = 7.0;
~dursec = 44.64;
0.5.wait;
~rate = ~f3.numFrames / ( ( (~durmin*60.0) + ~dursec ) * ~f3.sampleRate );
//0.1.wait;
~mainix = Synth(\mainidx, [\buf, ~f3, \rate, ~rate, \obs, 50], 5000);
SynthDef(\gr, {
	arg buf, envbuf, ixbus=50, dur=3.0, spd=1, och=0, amp=1, glissstart, glissend, t_tr=1;
	var sig, env, index, gliss, start;
	start = Latch.ar( In.ar(ixbus), t_tr );
	gliss = Line.ar(glissstart, glissend, dur);
	env = PlayBuf.ar( 1, envbuf, BufFrames.ir(envbuf)/(BufSampleRate.ir(envbuf)*dur), doneAction:2);
	index = Phasor.ar( 0, BufRateScale.kr(buf)*gliss, start, BufFrames.kr(buf) );
	sig = BufRd.ar(2, buf, index);
	Out.ar(och, sig*env*amp);
}).add;
	0.1.wait;
~ph1 = Synth(\gr, [\buf, ~f3, \envbuf, ~envs[7], \ixbus, 50, \dur, 3, \glissstart, 1, \glissend, 1.08], 5001);
}}
)





