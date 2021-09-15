#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import ncc from '@vercel/ncc';

import argHelper from '@henderea/arg-helper';
import arg from 'arg';
const { argParser } = argHelper(arg);

import { style, styles } from '@henderea/simple-colors';
const { bold, red } = styles;
const boldRed = style(bold, red.bright);


let dirname = fileURLToPath(import.meta.url);

try {
  dirname = eval('__dirname');
} catch {
  //empty
}


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
    .findVersion(dirname, '--version')
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
const outputDir = options.outputDir || 'dist';
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

ncc(filePath, nccOpts).then(({ code, map, assets }) => {
  if(options.outputFile) {
    const filePath = path.resolve(options.outputFile);
    ensureDir(filePath);
    fs.writeFileSync(filePath, code);
  } else {
    const filePath = path.resolve(outputDir, 'index.js');
    ensureDir(filePath);
    fs.writeFileSync(filePath, code);
    if(map) {
      fs.writeFileSync(path.resolve(outputDir, `index.js.map`), map);
    }
    Object.keys(assets).forEach((asset) => {
      const assetPath = path.resolve(outputDir, asset);
      ensureDir(assetPath);
      fs.writeFileSync(assetPath, assets[asset].source, { mode: assets[asset].permissions });
    });
  }
});
