const fs = require("fs");
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

module.exports = async (ctx, themeName) => {
  // Context and helper variables
  const themesFolder = path.join(ctx.pluginDir, 'themes');
  const themePath = path.join(themesFolder, themeName);
  const cachePath = path.join(themePath, '.cache');
  const cacheFilePath = path.join(cachePath, themeName + "-cache.json");

  // Create cache directory and file if they don't exist
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
  if (!fs.existsSync(cacheFilePath)) {
    fs.writeFileSync(cacheFilePath, JSON.stringify({ uploaded: {} }));
  }

  // Configuration and cache
  const config = {
    adminBaseUrl: ctx.khaConfig.url,
    token: ctx.khaConfig.token,
    theme: themeName
  };
  var cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
  const baseUrl = config.adminBaseUrl + "/api/front_v2.0.0";

  const main = async () => {
    console.log("Uploading Static Files ...");
    var loader = 0;
    var counter = 0;

    var purgeCache = async () => {
      // console.log("Purging CDN Cache ...");
      // try {
      //   let res = await axios.get(baseUrl + "/purge_cdn_cache", {
      //     headers: {
      //       _token: config.token,
      //     }
      //   });
      //   console.log("CDN Cache is purged");
      // } catch (error) {
      //   console.error(error);
      // }
    };

    var finishedLoader = () => {
      console.log("All Static Files are uploaded");
      fs.writeFileSync(cacheFilePath, JSON.stringify(cache));
    };

    var incLoader = () => { loader++; };
    var decLoader = () => {
      loader--;
      if (loader === 0) finishedLoader();
    };

    var uploadFile = async (file) => {
      var fileStats = fs.statSync(file);
      if (!(cache.uploaded[file] && cache.uploaded[file] === fileStats.mtime.getTime())) {
        var file_remote_path = file.replace(themePath + "/static/", "");
        console.log("    uploading [" + file + "] ...");
        console.log("    File number -> (" + counter + ")");

        const form = new FormData();
        form.append('file', fs.createReadStream(file));
        const request_config = {
          headers: {
            "_token": config.token,
            "file_remote_path": file_remote_path,
            ...form.getHeaders()
          },
        };

        incLoader();
        try {
          const res = await axios.post(baseUrl + "/store_static_file", form, request_config);
          cache.uploaded[file] = fileStats.mtime.getTime();
          counter++;
          // console.log("API Response: ");
          // console.log(res.data);
        } catch (error) {
          console.error(error);
        }
        decLoader();
      }
    };

    var folderFetcher = async (folderName) => {
      var list = fs.readdirSync(folderName);
      for (const file of list) {
        let fullPath = path.join(folderName, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
          await folderFetcher(fullPath);
        } else {
          await uploadFile(fullPath);
        }
      }
    };

    await folderFetcher(path.join(themePath, "static"));
    await purgeCache();
  };

  main();
};
