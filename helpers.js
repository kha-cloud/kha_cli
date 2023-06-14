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

function createContextHelpers(ctx) {
  return {
    // ------------------------------------------- DataCaller -------------------------------------------
    dataCaller: async (method, url, data) => {
      const response = await axios({
        method,
        url: `${ctx.khaConfig.url}${url}`,
        data,
        headers: {
          _token: ctx.khaConfig.token,
        },
      });
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
  createContextHelpers,
};
