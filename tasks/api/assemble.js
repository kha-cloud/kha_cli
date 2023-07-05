const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

function wrapFunctionInAsyncFunction(fn) {
  return `async function asyncFN () { ${fn} }; asyncFN();`;
}

function getRoutes(ctx, isLastError) {
  // Routes are defined in `api/routes.js`, the file should be executed and the exported array returned to be saved
  const routesFile = path.join(ctx.pluginDir, 'api', 'routes.js');
  // Check if the file is updated (compare the last modified time from cache)
  const lastModified = ctx.cache.get('routesFileLastModified');
  const currentModified = fs.statSync(routesFile).mtime.getTime();
  if ((lastModified && lastModified === currentModified) && !isLastError) {
    return ctx.cache.get('routes-file');
  } else {
    ctx.cache.set('routesFileLastModified', currentModified);
  }
  if (fs.existsSync(routesFile)) {
    // return require(routesFile);
    // if this function will be called multiple times, it should require the file each time to get the latest version
    // do not use `require` here, it will cache the file and not get the latest version
    // instead, use `eval` to execute the file and return the exported array
    const routes = eval(fs.readFileSync(routesFile, "utf8"));
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
        const controllerContent = eval(fs.readFileSync(controllerFile, "utf8"));
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
  const isLastError = ctx.cache.get('api-assembling-error');
  ctx.cache.set('api-assembling-error', true); // If do not reach end of the function, it means there is an error
  const originalDirectory = process.cwd();
  const packageDirectory = path.resolve(__dirname);

  // Switch to the package directory
  process.chdir(packageDirectory);

  const routes = getRoutes(ctx, isLastError);
  const controllers = getControllers(ctx, isLastError);

  process.chdir(originalDirectory);

  ctx.cache.set('api-assembling-error', false); // If reach end of the function, it means there is no error
  
  return {
    routes,
    controllers,
  };
};