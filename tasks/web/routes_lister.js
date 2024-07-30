const fs = require('fs');
const path = require('path');
const helpers = require('../../helpers');

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

function showRoutes(ctx, isLastError) {
  // Routes are defined in `api/routes.js`, the file should be executed and the exported array returned to be saved
  const routesFile = path.join(ctx.pluginDir, 'web', 'routes.js');

  if(!fs.existsSync(routesFile)) {
    return;
  }
  
  var routesFileContent = fs.readFileSync(routesFile, "utf8");
  routesFileContent = replaceInCode(routesFileContent, ctx);
  const routes = eval(routesFileContent);
  if(routes.length > 0) {
    helpers.log("WEB Routes:", "success");
    for(var i = 0; i < routes.length; i++) {
      const route = `/p${routes[i].route}`;
      helpers.log(`  ${routes[i].method.toUpperCase()} ${route}`, "info");
      console.log('           '+ctx.khaConfig.url+route);
      console.log('');
    }
  }
  
  if (!fs.existsSync(routesFile) || routes.length === 0) {
    console.log('No routes found');
  }

  helpers.log("Staic WEB Route:", "success");
  helpers.log(`  /api/plugins_static/${ctx.pluginKey}/`, "info");
  console.log('           '+ctx.khaConfig.url+`/api/plugins_static/${ctx.pluginKey}/`);
  
  return;
};

module.exports = showRoutes;