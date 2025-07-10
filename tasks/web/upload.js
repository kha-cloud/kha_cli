const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

function wrapFunctionInAsyncFunction(_fn) {
  var fn = '';
  if(typeof _fn === 'string') {
    fn = _fn
  } else if(typeof _fn === 'function') {
    fn = _fn.toString();
    fn = fn.substring(
      fn.indexOf('=>') + 1,
      fn.lastIndexOf('}')
    );
    fn = fn.substring(
      fn.indexOf('{') + 1,
      fn.length
    );
  }
  return `async function asyncFN () { ${fn} }; asyncFN();`;
}

function replaceInCode(code, ctx) {
  var newCode = code.replace(/@PS\//g, `/api/plugins_static/${ctx.pluginKey}/`);
  // Plugins Key
  newCode = newCode.replace(/@PK/g, `${ctx.pluginKey}`);
  // Plugins API links
  newCode = newCode.replace(/@PA\//g, `/api/plugin_api/${ctx.pluginKey}/`);
  // Plugins VueJS links
  newCode = newCode.replace(/@PV\//g, `/p/${ctx.pluginKey}/`);
  // Plugins VueJS public links
  newCode = newCode.replace(/@PVP\//g, `/public/${ctx.pluginKey}/`);
  return newCode;
}

function getRoutes(ctx, isLastError) {
  // Routes are defined in `web/routes.js`, the file should be executed and the exported array returned to be saved
  const routesFile = path.join(ctx.pluginDir, 'web', 'routes.js');
  // Check if the file is updated (compare the last modified time from cache)
  if (fs.existsSync(routesFile)) {
    const lastModified = ctx.cache.get('routesFileLastModified');
    const currentModified = fs.statSync(routesFile).mtime.getTime();
    if ((lastModified && lastModified === currentModified) && !isLastError) {
      return ctx.cache.get('web-routes-file');
    } else {
      ctx.cache.set('routesFileLastModified', currentModified);
    }
    // return require(routesFile);
    // if this function will be called multiple times, it should require the file each time to get the latest version
    // do not use `require` here, it will cache the file and not get the latest version
    // instead, use `eval` to execute the file and return the exported array
  
    var routesFileContent = fs.readFileSync(routesFile, "utf8");
    routesFileContent = replaceInCode(routesFileContent, ctx);
    const routes = eval(routesFileContent);
    for(var i = 0; i < routes.length; i++) {
      // Transpile the function to async function
      if(routes[i].function) {
        routes[i].function = babel.transformSync(wrapFunctionInAsyncFunction(routes[i].function), {
          presets: ['@babel/preset-env'],
        }).code;
      }

      // Check if the route starts with the plugin key
      if(routes[i].route && routes[i].route.startsWith(ctx.pluginKey)) {
        routes[i].route = "/"+routes[i].route;
      }
    }
    ctx.cache.set('web-routes-file', routes);
    return routes;

  }else {
    return [];
  }
};

const getLiquidFiles = (ctx, templateType, templateFolder) => {
  // The liquidFiles are loaded from the liquidFiles folder

  // Loading the liquidFiles
  const liquidFilesFolder = path.join(ctx.pluginDir, 'web', templateFolder);
  const liquidFiles = [];

  // Check if the liquidFiles folder exists else return empty array
  if (!fs.existsSync(liquidFilesFolder)) {
    return liquidFiles;
  }

  // Loading the liquidFiles recursively
  const loadLiquidFiles = (ctx, folder) => {
    // Get the folder content
    const folderContent = fs.readdirSync(folder);
    // Iterate over the folder content
    folderContent.forEach((item) => {
      // Get the item path
      const itemPath = path.join(folder, item);

      // If the item is a file, then check if it's a liquidFile (ends with .liquid)
      if (item.endsWith('.liquid')) {
        const itemState = fs.statSync(itemPath);
        if(itemState.size < 1) return;

        const liquidFile = {
          key: ctx.pluginKey + '_' + item.slice(0, -7),
          // code: fs.readFileSync(itemPath, 'utf8'),
          type: templateType,
          path: itemPath,
        };

        liquidFiles.push(liquidFile);
      }
    });
  };

  loadLiquidFiles(ctx, liquidFilesFolder);
  return liquidFiles;
};

const uploadLiquidFiles = async (ctx, liquidFiles) => {
  if(liquidFiles.length == 0) return;
  // ctx.helpers.log("Uploading Web liquid files ...");
  const config = {
    adminBaseUrl: ctx.khaConfig.url,
    token: ctx.khaConfig.token,
    // locales: [ "en", "ar", "zh", "fr", "de", "hi", "it", "ja", "pt", "ru", "es", "tr", "vi", "ko", "sw", "bn", "pa", "jv", "ms", "ta", "te", "mr", "kn", "gu", "or", "sd", "am", "af", "eu", "be", "bg", "ca", "cs", "cy", "da", "el", "et", "fa", "fi", "fy", "ga", "gl", "he", "hr", "hu", "hy", "id", "is", "ka", "kk", "km", "ky", "lb", "lt", "lv", "mk", "mn", "ne", "nl", "nn", "no", "pl", "ps", "ro", "sk", "sl", "sm", "sn", "so", "sq", "sr", "sv", "tg", "th", "tk", "tl", "tn", "uk", "ur", "uz", "xh", "yi", "yo", "zu"]
  };

  var firstSend = true;
  var everSent = false;
  var filesSentCounter = 0;

  for (const lif of liquidFiles) {
    var path = lif.path;
    const stats = fs.statSync(path);
    const cacheKey = "web_liquid_file_"+(path).replace(ctx.pluginDir, "")+"_updated";
    if (ctx.cache.get(cacheKey) == stats.mtime.getTime()) {
      continue;
    } else {
      if (firstSend) { ctx.helpers.log("Uploading Web liquid files ..."); firstSend = false; everSent = true;}
      ctx.helpers.log("... Sending [" + lif.key + ".liquid]", "info");
      var content = fs.readFileSync(path, 'utf8');
      content = replaceInCode(content, ctx);
      // await axios.post(
      await ctx.helpers.dataCaller(
        "post",
        "/api/front_v2.0.0/store_liquid_files/" + lif.type + "/" + lif.key,
        {
          content: content,
          type: lif.type,
        },
      ).then(() => {
        filesSentCounter++;
        ctx.cache.set(cacheKey, stats.mtime.getTime());
      }).catch((error) => {
        console.error("File not sent");
        console.error(error);
        throw new Error("Error sending file "+lif.key);
      });

    }
  }

  if(everSent) ctx.helpers.log("All Web liquid files are sent", "info");

  if (filesSentCounter > 0) {
    // console.log("");
    ctx.helpers.log(filesSentCounter+" updates are sent", "info");
  }
  return filesSentCounter;
  // if(filesSentCounter == 0) {
  //   console.log("    Already up to date.");
  // }
  // ctx.helpers.log("Finished uploading Web liquid files", "success");
};

module.exports = async (ctx) => {
  // ctx: (rootDir, command, pluginDir, pluginData, pluginKey, khaConfig, cache, clientCache, thirdPartyCache, helpers)
  // helpers: (sleep, cacheInit, getCache, setCache, createCacheObject, calculateChecksum, slugify, unSlugify, log, stringToHex, pathToLinuxFormat, incrementAlphabetCode)

  // Check  if web folder exists else return empty object
  if (!fs.existsSync(path.join(ctx.pluginDir, 'web'))) {
    return {
      routes: [],
    };
  }
  ctx.helpers.log("Assembling & uploading Web files");

  const isLastError = ctx.cache.get('web-assembling-error');
  ctx.cache.set('web-assembling-error', true); // If do not reach end of the function, it means there is an error
  const originalDirectory = process.cwd();
  const packageDirectory = path.resolve(__dirname);

  // Switch to the package directory
  process.chdir(packageDirectory);

  const routes = getRoutes(ctx, isLastError);
  const templates = getLiquidFiles(ctx, 'template', 'templates');
  const sections = getLiquidFiles(ctx, 'section', 'sections');

  const uploadedFilesSentCounter = await uploadLiquidFiles(ctx, [...templates, ...sections]);

  process.chdir(originalDirectory);

  ctx.cache.set('web-assembling-error', false); // If reach end of the function, it means there is no error
  ctx.helpers.log(`Finished assembling/uploading Web files (${uploadedFilesSentCounter || 0} files)`, "success");
  
  // console.log('Routes:', routes);
  // console.log('Templates:', templates);
  // console.log('Sections:', sections);
  return {
    routes,
    // templates,
    // sections,
  };
};