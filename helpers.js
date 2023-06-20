const fs = require('fs');
const path = require('path');
const checksum = require('checksum');
const axios = require('axios');

function cacheInit(cache_key, pluginDir) {
  const cacheDir = path.join(pluginDir, '.cache');
  const cacheFile = path.join(cacheDir, `${cache_key}.json`);
  
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }
  
  if (!fs.existsSync(cacheFile)) {
    fs.writeFileSync(cacheFile, '{}');
  }
};

function getCache(cache_key, pluginDir){
  cacheInit(cache_key, pluginDir);
  const cacheFile = path.join(pluginDir, '.cache', `${cache_key}.json`);
  return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
};

function setCache(cache_key, pluginDir, cache_data_key, cache_data_value){
  cacheInit(cache_key, pluginDir);
  const cacheFile = path.join(pluginDir, '.cache', `${cache_key}.json`);
  var cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  cache[cache_data_key] = cache_data_value;
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
  return cache;
};

function createCacheObject(cache_key, pluginDir) {
  var cache = {};
  cache.data = getCache(cache_key, pluginDir);
  cache.set = (key, value) => {
    cache.data = setCache(cache_key, pluginDir, key, value);
  };
  cache.get = (key) => {
    return cache.data[key];
  };
  return cache;
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

async function calculateChecksum(file) {
  return new Promise((resolve, reject) => {
    checksum.file(file, (err, sum) => {
      if (err) {
        reject(err);
      }else {
        resolve(sum);
      }
    });
  });
}

function slugify(text) {
  // Except alphanumeric characters, replace all other characters with a dash
  return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

var firstInfoLog = true;
function log(_text, color) {
  var text = (color == "info") ? " + "+_text : "► "+_text;
  if(!firstInfoLog && color !== 'error') {
    process.stdout.write('\u001b[1G'); // Move cursor to the beginning of the line
    process.stdout.write('\u001b[2K'); // Clear the entire line
  }
  if (color) {
    switch (color) {
      case 'error':
        console.error('\x1b[31m%s\x1b[0m', text);
        firstInfoLog = true;
        break;
      case 'success':
        console.log('\x1b[32m%s\x1b[0m', text);
        firstInfoLog = true;
        break;
      case 'warning':
        console.log('\x1b[33m%s\x1b[0m', text);
        firstInfoLog = true;
        break;
      case 'info':
        if (firstInfoLog) {
          firstInfoLog = false;
        }
        console.log('\x1b[34m%s\x1b[0m', text);
        firstInfoLog = true;
        break;
      default:
        console.log('\x1b[37m%s\x1b[0m', text);
        firstInfoLog = true;
        break;
    }
  } else {
    console.log(text);
    firstInfoLog = true;
  }
}

function stringToHex(str) {
  let hex = '';
  for(let i=0; i<str.length; i++) {
    hex += ''+str.charCodeAt(i).toString(16);
  }
  return hex;
}

function pathToLinuxFormat(pathVariable) {
  return path.posix.join(...path.normalize(pathVariable).split(path.sep));
}

// =======================================================================================================
// =========================================== Context Helpers ===========================================
// =======================================================================================================
function createContextHelpers(ctx) {
  return {
    // ------------------------------------------- DataCaller -------------------------------------------
    dataCaller: async (method, url, data, headers = {}, _config = {}) => {
      const config = {
        ..._config,
        method,
        url: `${ctx.khaConfig.url}${url}`,
        data,
        headers: {
          ...headers,
          _token: ctx.khaConfig.token,
        },
      };
      // console.log(" ------------------ config ------------------ ");
      // console.log(config);
      const response = await axios(config);
      return response.data;
    },
  };
}

module.exports = {
  sleep,
  cacheInit,
  getCache,
  setCache,
  createCacheObject,
  calculateChecksum,
  slugify,
  log,
  stringToHex,
  pathToLinuxFormat,

  // ------- Context Helpers -------
  createContextHelpers,
};
