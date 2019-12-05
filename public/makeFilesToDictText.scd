(
~pt = PathName.new("/Users/jyang/Documents/github/prolonged_into_the_latent/public/svgs/");
~mdict = "";
a = 36;
~pt.entries.do{|it ix|
	~mdict = ~mdict ++ a.asString ++ ": " ++ "'" ++ it.fullPath.replace("/Users/jyang/Documents/github/prolonged_into_the_latent/public", replace: "") ++ "'" ++ "," ++ Char.ret;
	a = a + 0.5;
};
~mdict.postln;
)
~toFile = File(~mdict, "w");
~toFile.write(~arr2Str);
~toFile.close;

