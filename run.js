#!/usr/bin/env node

// const initiatePlugins = require('./src/initiatePlugins');
const downloadPlugin = require('./src/download');
const uploadPlugin = require('./src/upload');
const disable = require('./src/disable');
const deletePlugin = require('./src/delete');

const command = process.argv[2];
const rootDir = process.cwd();

// if (command === 'fetch') {
//   initiatePlugins();
// } else 
if (command === 'download') {

  downloadPlugin();

}  else if (command === 'upload') {
  const pluginKey = process.argv[3];
  if (pluginKey) {
    uploadPlugin(pluginKey);
  } else {
    console.log('Please specify a plugin key');
  }
}  else if (command === 'disable') {
  const pluginKey = process.argv[3];
  if (pluginKey) {
    disable(pluginKey);
  } else {
    console.log('Please specify a plugin key');
  }
}  else if (command === 'delete') {
  const pluginKey = process.argv[3];
  if (pluginKey) {
    deletePlugin(pluginKey);
  } else {
    console.log('Please specify a plugin key');
  }
}  else {
  console.log(`Invalid command: ${command}`);
}
