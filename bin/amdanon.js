#!/usr/bin/env node

var anonymize = require("../"),
    path = require('path'),
    bundlePath = process.argv[2],
    mainModule = process.argv[3];

bundlePath = path.join(process.cwd(), bundlePath);

console.log(anonymize(bundlePath, mainModule));
