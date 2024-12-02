#!/usr/bin/env node

// IMPORTS
const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');

const initPlugin = require('./tasks/initPlugin');
const uploadPlugin = require('./tasks/upload');
const listPluginRoutes = require('./tasks/listPluginRoutes');
const listenForChanges = require('./tasks/listenForChanges');
const pethTasksHandler = require('./tasks/pethTasksHandler');

const initTheme = require('./tasks/themes/init');
const uploadTheme = require('./tasks/themes/upload');
const uploadStaticTheme = require('./tasks/themes/upload_static');

const queryAi = require('./tasks/queryAi');
const connectProject = require('./tasks/connect/connectProject');
const connectCreateConfig = require('./tasks/connect/connectCreateConfig');
const helpers = require('./helpers');


// INITIALIZATION
const rootDir = __dirname;
const command = process.argv[2];
const commandArgs = process.argv.slice(3);
const pluginDir = process.cwd();

// All command params (a param starts with "--xx=data")
const commandParams = {};
for (let i = 0; i < commandArgs.length; i++) {
  const arg = commandArgs[i];
  if (arg.startsWith('--')) {
    const [key, value] = arg.split('=');
    commandParams[key.slice(2)] = value;
  }
}

// Print Version
if ((command == 'version') || (command == '--version') || (command == '-v')) {
  // Read the package.json file
  const packageJsonPath = path.resolve(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Print the version
  console.log(`Current version: ${packageJson.version}`);
  process.exit(1);
}

// Init fix
if ((command === 'init') && commandArgs[0]) {
  initPlugin({
      pluginDir,
      helpers,
    },
    (commandArgs[0] == 'fix'), // isFixInit = true
    commandArgs[0]
  ).then(() => {
    console.log('Plugin fix initialization finished');
    process.exit(1);
  });
  process.exit(1);
} 

// LOADING
var isInit = false;
var isConnect = false;
if(!fs.existsSync(path.join(pluginDir, 'plugin.jsonc'))) {
  if ((command === 'init') && (commandArgs.length === 0)) {
    isInit = true;
    initPlugin({
      pluginDir,
      helpers,
    }).then(() => {
      process.exit(1);
    });
  } else if (command != 'connect') {
    console.error('Please run this command from the root of your project');
    console.error('    File not found: ', path.join(pluginDir, 'plugin.jsonc'));
    process.exit(1);
  }
}
if (command === 'connect') {
  isConnect = true;
  switch (commandArgs[0]) {
    case "config":
      connectCreateConfig({
        pluginDir,
        helpers,
      });
      break;
  
    default:
      connectProject({
        pluginDir,
        helpers,
      });
      break;
  }
}

if(!fs.existsSync(path.join(pluginDir, 'kha-plugin-config.jsonc')) && !isInit && !isConnect) {
  console.error('Please run this command from the root of your project');
  console.error('    File not found: ', path.join(pluginDir, 'kha-plugin-config.jsonc'));
  process.exit(1);
}

if(!isInit && !isConnect) run();

// MAIN
function main() {
  console.log('Available commands:');
  console.log('    upload');
  console.log('    upload --ignore=tasks,adminui,... (Optional)');
  console.log('    listen');
  console.log('    init <- (This command is only available when plugin is not initialized yet)');
  console.log('    init fix');
  console.log('    ai');
  console.log('    connect <- (This command is available for all types of projects)');
  console.log('    connect config <- (This command is available for all types of projects)');
  console.log('    theme');
  console.log('    routes');
  console.log('    theme init <THEME_NAME>');
  console.log('    theme upload <THEME_NAME>');
  console.log('    theme static-upload <THEME_NAME>');
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

  var clientCache = helpers.createCacheObject("client_"+helpers.slugify(khaConfig.url.replace("https://", ""))+"_cache", pluginDir);

  var thirdPartyCache = helpers.createCacheObject("third_party_cache", pluginDir);
  
  var context = {
    rootDir,
    command,
    commandParams,
    pluginDir,
    pluginData,
    pluginKey,
    khaConfig,
    cache,
    clientCache,
    thirdPartyCache,
    helpers: null
  };
  context.helpers = {
    ...helpers,
    ...helpers.createContextHelpers(context),
  };
  // ctx: (rootDir, command, pluginDir, pluginData, pluginKey, khaConfig, cache, clientCache, thirdPartyCache, helpers)
  // helpers: (sleep, cacheInit, getCache, setCache, createCacheObject, calculateChecksum, slugify, unSlugify, log, stringToHex, pathToLinuxFormat, incrementAlphabetCode)

  // COMMANDS
  if (command === 'upload') {
    uploadPlugin(context);
  }else if (command === 'routes') {
    listPluginRoutes(context);
  }else if (command === 'task') {
    pethTasksHandler(context);
  }else if (command === 'listen') {
    listenForChanges(context);
  }else if (command === 'ai') {
    queryAi(context);
  // } else if (command === 'connect') {
  //   connectProject(context);
  } else if (command === 'theme') {
    const themeCommand = commandArgs[0];
    var themeName = commandArgs[1];
    const currentThemes = fs.readdirSync(path.join(pluginDir, 'themes'));
    if(!themeName && currentThemes.length === 1) themeName = currentThemes[0];
    if (themeCommand === 'init') {
      initTheme(context, themeName);
    } else if (themeCommand === 'upload') {
      uploadTheme(context, themeName);
    } else if (themeCommand === 'static-upload') {
      uploadStaticTheme(context, themeName);
    } else {
      console.log('Available commands:');
      console.log('    init <THEME_NAME>');
      console.log('    upload <THEME_NAME>');
      console.log('    static-upload <THEME_NAME>');
      console.log();
      console.log('Current themes:');
      for (const theme of currentThemes) {
        console.log('    ' + theme);
      }
      console.log();
    }

  }else {
    main();
  }

}

