const fs = require("fs");
const axios = require('axios');
const path = require('path');
const commentJson = require('comment-json');

module.exports = async (ctx, themeName) => {
  // ctx: (rootDir, command, pluginDir, pluginData, pluginKey, khaConfig, cache, clientCache, thirdPartyCache, helpers)
  // helpers: (sleep, cacheInit, getCache, setCache, createCacheObject, calculateChecksum, slugify, unSlugify, log, stringToHex, pathToLinuxFormat, incrementAlphabetCode)

  const themesFolder = path.join(ctx.pluginDir, 'themes');
  const themePath = path.join(ctx.pluginDir, 'themes', themeName);
  const cachePath = path.join(themePath, '.cache');
  const cacheFilePath = path.join(cachePath, themeName+"-cache.json");

  //Checking for files and folders existence
  if(!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
  if (!fs.existsSync(cacheFilePath)) fs.writeFileSync(cacheFilePath, JSON.stringify({ uploaded: {} }));

  const config = {
    adminBaseUrl: ctx.khaConfig.url,
    token: ctx.khaConfig.token,
    dataToSkip: [],
    theme: themeName,
    locales: [ "en", "ar", "zh", "fr", "de", "hi", "it", "ja", "pt", "ru", "es", "tr", "vi", "ko", "sw", "bn", "pa", "jv", "ms", "ta", "te", "mr", "kn", "gu", "or", "sd", "am", "af", "eu", "be", "bg", "ca", "cs", "cy", "da", "el", "et", "fa", "fi", "fy", "ga", "gl", "he", "hr", "hu", "hy", "id", "is", "ka", "kk", "km", "ky", "lb", "lt", "lv", "mk", "mn", "ne", "nl", "nn", "no", "pl", "ps", "ro", "sk", "sl", "sm", "sn", "so", "sq", "sr", "sv", "tg", "th", "tk", "tl", "tn", "uk", "ur", "uz", "xh", "yi", "yo", "zu"]
  };
  var cache = commentJson.parse(fs.readFileSync(cacheFilePath, 'utf8'));
  const baseUrl = config.adminBaseUrl + "/api/front_v2.0.0";

  if (!config.dataToSkip) config.dataToSkip = [];

  const main = async () => {

    var filesSentCounter = 0;
    // var templates = ["home_page", "header", "layout_page", "collection_page", "product_page", "cart_page", "footer"];
    // templates = templates.concat(config.templates);
    var liquidFiles = [];

    var templates = fs.readdirSync(themesFolder + "/" + config.theme + '/templates');
    for (const template of templates.filter(f => f.includes(".liquid"))) {
      liquidFiles.push({
        type: "template",
        folder: "templates",
        key: template.replace(".liquid", "")
      });
    }

    var sections = fs.readdirSync(themesFolder + "/" + config.theme + '/sections');
    for (const section of sections.filter(f => f.includes(".liquid"))) {
      liquidFiles.push({
        type: "section",
        folder: "sections",
        key: section.replace(".liquid", "")
      });
    }

    var pagesData = commentJson.parse(fs.readFileSync(themesFolder+"/"+config.theme+'/config/pages.jsonc', 'utf8'));
    for (const page of pagesData) {
      liquidFiles.push({
        type: "template",
        folder: "templates",
        key: page.template
      });
    }

    var layoutsData = fs.readdirSync(themesFolder + "/" + config.theme + '/layout');
    for (const layout of layoutsData) {
      liquidFiles.push({
        type: "layout",
        folder: "layout",
        key: layout.replace(".liquid", "")
      });
    }



    //Storing liquid files
    if (!config.dataToSkip.includes("liquid_files")) {
      var firstSend = true;
      var everSent = false;
      for (const lif of liquidFiles) {
        var path = themesFolder+"/"+config.theme+"/" + lif.folder + "/" + lif.key + ".liquid";
        const stats = fs.statSync(path);
        if (cache.uploaded[path] && cache.uploaded[path] == stats.mtime.getTime()) {
          continue;
        } else {
          if (firstSend) { console.log("Storing liquid files ..."); firstSend = false; everSent = true;}
          console.log("    Sending " + lif.key);
          var content = fs.readFileSync(path, 'utf8');
          await axios.post(
            baseUrl + "/store_liquid_files/" + lif.type + "/" + lif.key,
            {
              content: content,
              type: lif.type,
            },
            {
              headers: {
                _token: config.token,
              }
            }
          ).then(() => {
            filesSentCounter++;
            cache.uploaded[path] = stats.mtime.getTime();
          }).catch(() => {
            console.error("File not sent");
          });
    
        }
      }
      if(everSent) console.log("All liquid files are sent");
    }

    // Settings Schema File
    if (!config.dataToSkip.includes("settings_structure")) {
      var path = themesFolder+"/"+config.theme+'/config/settings_schema.jsonc';
      var fileStats = fs.statSync(path);
      // if (!(cache.uploaded[path] && cache.uploaded[path] == fileStats.mtime.getTime())) {
        console.log("Sending settings_schema ...");
        var content = fs.readFileSync(path, 'utf8');
        content = commentJson.parse(content);
        await axios.post(
          baseUrl + "/store_settings_schema/",
          content,
          {
            headers: {
              _token: config.token,
            }
          }
        ).then(() => {
          filesSentCounter++;
          cache.uploaded[path] = fileStats.mtime.getTime();
          console.log("    data is sent");
        }).catch((error) => {
          console.error(error);
        });
      // }
    }

    // Settings Data File
    if (!config.dataToSkip.includes("settings_data")) {
      var path = themesFolder+"/"+config.theme+'/config/settings_data.jsonc';
      var fileStats = fs.statSync(path);
      if (!(cache.uploaded[path] && cache.uploaded[path] == fileStats.mtime.getTime())) {
        console.log("Sending settings_data ...");
        var content = fs.readFileSync(path, 'utf8');
        content = commentJson.parse(content);
        await axios.post(
          baseUrl + "/store_settings_data/",
          content,
          {
            headers: {
              _token: config.token,
            }
          }
        ).then(() => {
          filesSentCounter++;
          cache.uploaded[path] = fileStats.mtime.getTime();
          console.log("    data is sent");
        }).catch((error) => {
          console.error(error);
        });
      }
    }

    // Pages File
    if (!config.dataToSkip.includes("liquid_files")) {
      var path = themesFolder+"/"+config.theme+'/config/pages.jsonc';
      var fileStats = fs.statSync(path);
      if (!(cache.uploaded[path] && cache.uploaded[path] == fileStats.mtime.getTime())) {
        console.log("Sending pages ...");
        var content = fs.readFileSync(path, 'utf8');
        content = commentJson.parse(content);
        await axios.post(
          baseUrl + "/store_pages/",
          content,
          {
            headers: {
              _token: config.token,
            }
          }
        ).then(() => {
          filesSentCounter++;
          cache.uploaded[path] = fileStats.mtime.getTime();
          console.log("    data is sent");
        }).catch((error) => {
          console.error(error);
        });
      }
    }

    // Locales
    if (config.locales) {
      var sendLanguages = false;
      var languagesObject = {};
      for (const lang of config.locales) {
        var path = themesFolder+"/"+config.theme+"/locales/" + lang + ".json";
        // if path does not exist, skip
        if (!fs.existsSync(path)) {
          continue;
        }
        var content = fs.readFileSync(path, 'utf8');
        languagesObject[lang] = commentJson.parse(content);
        const stats = fs.statSync(path);
        if (cache.uploaded[path] && cache.uploaded[path] == stats.mtime.getTime()) {
          continue;
        } else {
          sendLanguages = true;
          cache.uploaded[path] = stats.mtime.getTime();
        }
      }
      if (sendLanguages) {
        console.log("Uploading Language files");
        await axios.post(
          baseUrl + "/store_locales/",
          languagesObject,
          {
            headers: {
              _token: config.token,
            }
          }
        ).then(() => {
          filesSentCounter++;
          console.log("    data is sent");
        }).catch((error) => {
          console.error(error);
        });
      }
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache));

    if (filesSentCounter > 0) {
      console.log("");
      console.log(filesSentCounter+" updates are sent");
    }
    if(filesSentCounter == 0) console.log("Already up to date.");

  }

  main();

};