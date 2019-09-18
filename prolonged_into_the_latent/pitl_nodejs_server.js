var express = require('express');
var app = require('express')();
var path = require('path');

//Set Up Static File Serving
app.use(express.static(path.join(__dirname, '/public')));
//Launch 'index.html'
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

//start http server
app.listen(4321, function() {
  console.log('listening on *:4321');
});
