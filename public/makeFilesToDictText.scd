(
~pt = PathName.new("/Users/jyang/Documents/github/prolonged_into_the_latent/public/samples/voices_f/");
~mdict = "";
a = 57;
~pt.entries.do{|it ix|
	~mdict = ~mdict ++ a.asString ++ ": " ++ "'" ++ it.fullPath.replace("/Users/jyang/Documents/github/prolonged_into_the_latent/public", replace: "") ++ "'" ++ "," ++ Char.ret;
	a = a + 1;
};
~mdict.postln;
)


