const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');

const getAdminUIConfig = (ctx) => {
  const configFile = path.join(ctx.pluginDir, 'adminUI', 'config.jsonc');
  const configContent = fs.readFileSync(configFile, 'utf8');
  const config = commentJson.parse(configContent);
  return config;
};

const getAdminUIMenus = (ctx) => {
  const menusFile = path.join(ctx.pluginDir, 'adminUI', 'menus.jsonc');
  const menusContent = fs.readFileSync(menusFile, 'utf8');
  const menus = commentJson.parse(menusContent);
  return menus;
};

const getAdminUIStore = (ctx) => {
  const storeFile = path.join(ctx.pluginDir, 'adminUI', 'store.js');
  const storeContent = fs.readFileSync(storeFile, 'utf8');
  return storeContent;
};

module.exports = async (ctx) => {

  var lastUpdates = ctx.cache.get('adminui_last_updates');

  // Retrieve the configuration for the admin UI
  const adminUiConfig = getAdminUIConfig(ctx);

  // Retrieve the menus for the admin UI
  const adminUIMenus = getAdminUIMenus(ctx);

  // Retrieve the store for the admin UI
  const adminUIStore = getAdminUIStore(ctx);

  // Retrieve the pages
  //TODO Load the pages from the pages folder
  //TODO Generate the pages routes and dynamic routes
  //TODO Only if there are changes do compile

  return {
    config: adminUiConfig,
    menus: adminUIMenus,
    store: adminUIStore,
    // pages: [],
  };

};