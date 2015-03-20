#!/usr/bin/env node

var anonymize = require("../"),
    path = require('path'),
    fs = require('fs'),
    bundlePath = process.argv[2],
    mainModule = process.argv[3];

bundlePath = path.join(process.cwd(), bundlePath);

fs.readFile(bundlePath, function(err, data){
    if (err) return console.log(err);
    console.log(anonymize(data, mainModule));
});
