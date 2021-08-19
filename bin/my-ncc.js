#!/usr/bin/env node

const ncc = require('@vercel/ncc');
const fs = require('fs');
const path = require('path');

const { argParser } = require('@henderea/arg-helper')(require('arg'));

const { style, styles } = require('@henderea/simple-colors');
const { bold, red } = styles;
const boldRed = style(bold, red.bright);

let options = null;
try {
  options = argParser()
    .strings('externals', '-e', '--external')
    .bool('minify', '-m', '--minify')
    .string('outputDir', '-o', '--out')
    .string('outputFile', '-f', '--output-file')
    .bool('quiet', '-q', '--quiet')
    .bool('noCache', '-C', '--no-cache')
    .bool('sourceMap', '-s', '--source-map')
    .bool('watch', '-w', '--watch')
    .bool('transpileOnly', '-t', '--transpile-only')
    .argv;
} catch (e) {
  console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
  process.exit(1);
}

const fileName = options._[0];
if(!fileName) {
  console.error(boldRed('Expected a file name positional parameter'));
  process.exit(1);
}
const filePath = path.resolve(fileName);
if(!fs.existsSync(filePath)) {
  console.error(boldRed(`Could not find file ${fileName}`));
  process.exit(1);
}

const nccOpts = { esm: false };

if('externals' in options) {
  nccOpts.externals = options.externals;
}
if('minify' in options) {
  nccOpts.minify = options.minify;
}
const outputDir = options.outputDir || '.';
if('quiet' in options) {
  nccOpts.quiet = options.quiet;
}
if(options.noCache) {
  nccOpts.cache = false;
}
if('sourceMap' in options) {
  nccOpts.sourceMap = options.sourceMap;
}
if('watch' in options) {
  nccOpts.watch = options.watch;
}
if('transpileOnly' in options) {
  nccOpts.transpileOnly = options.transpileOnly;
}

function ensureDir(filePath) {
  const dirName = path.dirname(filePath);
  if(!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
}

ncc(filePath, nccOpts).then(({ code }) => {
  const filePath = path.resolve(outputDir, 'index.js');
  ensureDir(filePath);
  fs.writeFileSync(filePath, code);
});
