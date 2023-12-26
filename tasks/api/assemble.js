const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

function wrapFunctionInAsyncFunction(fn) {
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
  // Routes are defined in `api/routes.js`, the file should be executed and the exported array returned to be saved
  const routesFile = path.join(ctx.pluginDir, 'api', 'routes.js');
  // Check if the file is updated (compare the last modified time from cache)
  if (fs.existsSync(routesFile)) {
    const lastModified = ctx.cache.get('routesFileLastModified');
    const currentModified = fs.statSync(routesFile).mtime.getTime();
    if ((lastModified && lastModified === currentModified) && !isLastError) {
      return ctx.cache.get('routes-file');
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
      if(routes[i].function) {
        routes[i].function = babel.transformSync(wrapFunctionInAsyncFunction(routes[i].function), {
          presets: ['@babel/preset-env'],
        }).code;
      }
    }
    ctx.cache.set('routes-file', routes);
    return routes;

  }else {
    return [];
  }
};

function getIO(ctx, isLastError) {
  const ioFile = path.join(ctx.pluginDir, 'api', 'io.js');
  
  if (fs.existsSync(ioFile)) {
    // Check if the file is updated (compare the last modified time from cache)
    const lastModified = ctx.cache.get('ioFileLastModified');
    const currentModified = fs.statSync(ioFile).mtime.getTime();
    if ((lastModified && lastModified === currentModified) && !isLastError) {
      return ctx.cache.get('io-file');
    } else {
      ctx.cache.set('ioFileLastModified', currentModified);
    }

    var ioFileContent = fs.readFileSync(ioFile, "utf8");
    ioFileContent = replaceInCode(ioFileContent, ctx);

    ctx.cache.set('io-file', ioFileContent);
    return ctx.cache.get('io-file');
  } else {
    return "";
  }
}

function getControllers(ctx, isLastError) {
  // Controllers are defined in the folder `api/controllers/`, the files should be executed and the exported object returned to be saved
  const controllersDir = path.join(ctx.pluginDir, 'api', 'controllers');
  if (fs.existsSync(controllersDir)) {
    const controllers = {};
    fs.readdirSync(controllersDir).forEach(file => {
      const controllerFile = path.join(controllersDir, file);
      if (fs.lstatSync(controllerFile).isFile()) {
        // controllers[file] = require(controllerFile);
        // if this function will be called multiple times, it should require the file each time to get the latest version
        // do not use `require` here, it will cache the file and not get the latest version
        // instead, use `eval` to execute the file and return the exported object
        const className = file.split('.').slice(0, -1).join('.');
        // Check if the file is updated (compare the last modified time from cache)
        const lastModified = ctx.cache.get(`controllerFileLastModified-${controllerFile}`);
        const currentModified = fs.statSync(controllerFile).mtime.getTime();
        if ((lastModified && lastModified === currentModified) && !isLastError) {
          controllers[className] = ctx.cache.get(`controllerFile-${controllerFile}`);
          return;
        } else {
          ctx.cache.set(`controllerFileLastModified-${controllerFile}`, currentModified);
        }


        var controllerFileContent = fs.readFileSync(controllerFile, "utf8");
        controllerFileContent = replaceInCode(controllerFileContent, ctx);

        const controllerContent = eval(controllerFileContent);
        for(var key in controllerContent) {
          if(typeof controllerContent[key] === 'string') {
            controllerContent[key] = babel.transformSync(wrapFunctionInAsyncFunction(controllerContent[key]), {
              presets: ['@babel/preset-env'], // to install @babel/preset-env run `npm install --save-dev @babel/preset-env`
            }).code;
          }
        }
        ctx.cache.set(`controllerFile-${controllerFile}`, controllerContent);
        controllers[className] = controllerContent;
        // controllers[className] = eval(fs.readFileSync(controllerFile, "utf8"));
      }
    });
    return controllers;
  }else {
    return {};
  }
};

module.exports = async (ctx) => {
  // ctx: (rootDir, command, pluginDir, pluginData, pluginKey, khaConfig, cache, clientCache, thirdPartyCache, helpers)
  // helpers: (sleep, cacheInit, getCache, setCache, createCacheObject, calculateChecksum, slugify, unSlugify, log, stringToHex, pathToLinuxFormat, incrementAlphabetCode)

  const isLastError = ctx.cache.get('api-assembling-error');
  ctx.cache.set('api-assembling-error', true); // If do not reach end of the function, it means there is an error
  const originalDirectory = process.cwd();
  const packageDirectory = path.resolve(__dirname);

  // Switch to the package directory
  process.chdir(packageDirectory);

  const routes = getRoutes(ctx, isLastError);
  const controllers = getControllers(ctx, isLastError);
  const io = getIO(ctx, isLastError);

  process.chdir(originalDirectory);

  ctx.cache.set('api-assembling-error', false); // If reach end of the function, it means there is no error
  
  return {
    routes,
    controllers,
    io,
    middleware, // TODO: Add middlewares support
  };
};