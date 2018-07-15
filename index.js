#!/usr/bin/env node

// Thanks to Jarno Rantanen (@Jareware)
// https://gist.github.com/jareware/7af17f2034931608e842 

var program = require('commander');
var fs = require('fs');
var libxmljs = require('libxmljs');

var XML_PREFIX = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?><tt:tt xmlns:tt="http://www.w3.org/ns/ttml"><tt:head></tt:head><tt:body><tt:div>\n';
var XML_SUFFIX = '\n</tt:div></tt:body></tt:tt>';

program
  .version('0.1.0')
  .option('-s, --source [path]', 'dxfp source file')
  .option('-d, --dest [path]', 'srt file to write')
  .parse(process.argv);

if (!program.source || !program.dest) {
  program.outputHelp();
  return;
}

console.log(`Processing ${program.source}`);

const sourceText = fs.readFileSync(program.source, { encoding: 'utf-8' });
const xml = libxmljs.parseXml(sourceText);
const subsEls = xml.find('//tt:p', { tt: 'http://www.w3.org/ns/ttml' });
const subs = {};

subsEls.forEach(function (subEl) {
  var begin = subEl.attr('begin').value().replace(/:(\d+)$/, ',$1'); // ":frame" -> ",frame"
  var end = subEl.attr('end').value().replace(/:(\d+)$/, ',$1');
  var content = subEl.text().trim();
  if (subs[begin]) {
      subs[begin].content.push(content); // combine content with the same timecode
  } else {
      subs[begin] = {
          begin: begin.replace('.', ','),
          end: end.replace('.', ','),
          content: [ content ]
      }
  }
});

let count = 1;
const srt = Object.keys(subs).map(function(key) {
    const sub = subs[key];
    return `${count++}\n${sub.begin} --> ${sub.end}\n${sub.content}`;
});

fs.writeFileSync(program.dest, srt.join('\n\n\n'));

console.log(`SRT subtitles written to ${program.dest}`);
