const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');
const { compileVue } = require('./build_vue');

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
  menus.mainMenu = menus.mainMenu.map(menu => {
    if(!menu.to) return menu;
    return {
      ...menu,
      to: `/p/${ctx.pluginKey}${menu.to}`,
    };
  });
  menus.profileMenu = menus.profileMenu.map(menu => {
    if(!menu.to) return menu;
    return {
      ...menu,
      to: `/p/${ctx.pluginKey}${menu.to}`,
    };
  });
  return menus;
};

const getAdminUIStore = (ctx) => {
  const storeFile = path.join(ctx.pluginDir, 'adminUI', 'store.js');
  const storeContent = fs.readFileSync(storeFile, 'utf8');
  return storeContent;
};

const getAdminUIPages = (ctx) => {
  // The pages are loaded from the pages folder and it's subfolders, and the routes are generated from the folder structure
  // Use a recursive function to load the pages
  // Routes should follow the NuxtJS routes structure
  // If there is a _slug.vue file, then the name `slug` should be a parameter in the route
  // If there is an index.vue file, then the route should be the folder name
  // If there is a _slug/index.vue file, then the name `slug` should be a parameter in the route and the route should be the folder name
  // If there is a _slug/_id.vue file, then the name `slug` should be a parameter in the route and the name `id` should be a parameter in the route

  // Loading the pages
  const pagesFolder = path.join(ctx.pluginDir, 'adminUI', 'pages');
  const pages = [];

  // Loading the pages recursively
  const loadPages = (ctx, folder, parentRoute = '') => {
    // Get the folder content
    const folderContent = fs.readdirSync(folder);
    // Iterate over the folder content
    folderContent.forEach((item) => {
      // Get the item path
      const itemPath = path.join(folder, item);

      // Check if the item is a folder
      if (fs.lstatSync(itemPath).isDirectory()) {
        // If the item is a folder, then load the pages from the folder
        const newItemName = item.startsWith('_') ? ":" + item.slice(1) : item; // Replace the _ with : to make it a parameter
        loadPages(ctx, itemPath, path.join(parentRoute, newItemName));
      } else {
        // If the item is a file, then check if it's a page (ends with .vue)
        if (item.endsWith('.vue')) {
          // If item size is 9 bytes or less, then it's an empty file, so ignore it
          const itemState = fs.statSync(itemPath);
          if(itemState.size <= 9) return;
          const page = {
            route: '',
            component: itemPath.replace(path.join(ctx.pluginDir, 'adminUI'), '').replace(/\\/g, '/'),
            updated: false,
            name: '',
          };
          page.name = ctx.helpers.slugify(ctx.pluginKey+page.component).replace(/-/g, '_');
          const cache_updated_date = ctx.cache.get(`adminui_page_${page.component}_updated`);
          const updated_date = itemState.mtime.getTime();
          page.updated = (cache_updated_date !== updated_date);
          if(page.updated) ctx.cache.set(`adminui_page_${page.component}_updated`, updated_date);
          // Case 1: The page is an index.vue file
          if (item === 'index.vue') {
            page.route = parentRoute;
          }
          // Case 2: The page is a _slug.vue file
          else if (item.startsWith('_')) {
            page.route = path.join(parentRoute, ':' + item.slice(1, -4));
          }
          // Case 3: The page is a normal vue file
          else {
            page.route = path.join(parentRoute, item.slice(0, -4));
          }
          pages.push(page);
        }
      }
    });
  };

  loadPages(ctx, pagesFolder, '/');
  return pages;
};



module.exports = async (ctx) => {

  var lastUpdates = ctx.cache.get('adminui_last_updates');

  // Retrieve the configuration for the admin UI
  const adminUIConfig = getAdminUIConfig(ctx);

  // Retrieve the menus for the admin UI
  const adminUIMenus = getAdminUIMenus(ctx);

  // Retrieve the store for the admin UI
  const adminUIStore = getAdminUIStore(ctx);

  // Retrieve the pages
  const adminUIPages = getAdminUIPages(ctx);
  
  // Generate the pages routes and dynamic routes
  // Only if there are changes do compile
  const recompilePages = (adminUIPages.filter((page) => page.updated).length > 0);
  var compiledPages;
  if (recompilePages) {
    // Compile the pages
    compiledPages = await compileVue(ctx, adminUIPages);
    // Save the last updates
    ctx.cache.set('adminui_compiled_pages', compiledPages);
  } else {
    // Load the last updates
    compiledPages = ctx.cache.get('adminui_compiled_pages');
  }

  return {
    config: adminUIConfig,
    menus: adminUIMenus,
    store: adminUIStore,
    pages: adminUIPages,
    compiled: compiledPages,
  };

};