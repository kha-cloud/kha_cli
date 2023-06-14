#!/usr/bin/env node

// IMPORTS
const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');
const uploadPlugin = require('./tasks/upload');
const listenForChanges = require('./tasks/listenForChanges');
const initPlugin = require('./tasks/initPlugin');
const helpers = require('./helpers');


// INITIALIZATION
const rootDir = __dirname;
const command = process.argv[2];
const pluginDir = process.cwd();


// LOADING
var isInit = false;
if(!fs.existsSync(path.join(pluginDir, 'plugin.jsonc'))) {
  if (command === 'init') {
    isInit = true;
    initPlugin({
      pluginDir,
    }).then(() => {
      process.exit(1);
    });
  }else {
    console.error('Please run this command from the root of your project');
    console.error('    File not found: ', path.join(pluginDir, 'plugin.jsonc'));
    process.exit(1);
  }
}

if(!fs.existsSync(path.join(pluginDir, 'kha-plugin-config.jsonc')) && !isInit) {
  console.error('Please run this command from the root of your project');
  console.error('    File not found: ', path.join(pluginDir, 'kha-plugin-config.jsonc'));
  process.exit(1);
}

if(!isInit) run();

// MAIN
function main() {
  console.log('Available commands:');
  console.log('    upload');
  console.log('    listen');
  console.log();
  // console.log('rootDir = ', rootDir);
  // console.log('command = ', command);
  // console.log('pluginDir = ', pluginDir);
}

async function run() {

  const pluginData = commentJson.parse(fs.readFileSync(path.join(pluginDir, 'plugin.jsonc'), 'utf8'));

  const pluginKey = pluginData.key;
  const khaConfig = commentJson.parse(fs.readFileSync(path.join(pluginDir, 'kha-plugin-config.jsonc'), 'utf8'));
  khaConfig.url = khaConfig.url.replace(/\/$/, "");

  var cache = helpers.createCacheObject("global_cache", pluginDir);

  var clientCache = helpers.createCacheObject("client_"+helpers.slugify(khaConfig.url)+"_cache", pluginDir);

  //TODO Load Cache (Last Upload Date, File Hashes, etc.)

  var context = {
    rootDir,
    command,
    pluginDir,
    pluginData,
    pluginKey,
    khaConfig,
    cache,
    clientCache,
    helpers: null
  };
  context.helpers = {
    ...helpers,
    ...helpers.createContextHelpers(context),
  };

  // COMMANDS
  if (command === 'upload') {
    uploadPlugin(context);
  }else if (command === 'listen') {
    listenForChanges(context);
  }else {
    main();
  }

}

