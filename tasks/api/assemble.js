const fs = require('fs');
const path = require('path');

function getRoutes(ctx) {
  // Routes are defined in `api/routes.js`, the file should be executed and the exported array returned to be saved
  const routesFile = path.join(ctx.pluginDir, 'api', 'routes.js');
  if (fs.existsSync(routesFile)) {
    // return require(routesFile);
    // if this function will be called multiple times, it should require the file each time to get the latest version
    // do not use `require` here, it will cache the file and not get the latest version
    // instead, use `eval` to execute the file and return the exported array
    return eval(fs.readFileSync(routesFile, "utf8"));
  }else {
    return [];
  }
};

function getControllers(ctx) {
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
        controllers[className] = eval(fs.readFileSync(controllerFile, "utf8"));
      }
    });
    return controllers;
  }else {
    return {};
  }
};

module.exports = async (ctx) => {
  const routes = getRoutes(ctx);
  const controllers = getControllers(ctx);
  
  return {
    routes,
    controllers,
  };
};