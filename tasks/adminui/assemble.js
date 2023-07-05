const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');
const { compilePagesVue } = require('./build_pages_vue');
const { compilePartialsVue } = require('./build_partials_vue');

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
  if(!menus.mainMenu) menus.mainMenu = [];
  if(!menus.profileMenu) menus.profileMenu = [];
  
  menus.mainMenu = menus.mainMenu.map(menu => {
    if(!menu.to) return menu;
    if(menu.to.startsWith('http')) return menu; // External link
    if(menu.to.startsWith('@/')){ // Link to a page in the administration
      return {
        ...menu,
        to: menu.to.slice(1),
      };
    }
    var menuTo = menu.to.startsWith('/') ? menu.to : `/${menu.to}`;
    menuTo = menuTo.startsWith('@PV/') ? menuTo.slice(4) : menuTo;
    return {
      ...menu,
      to: `/p/${ctx.pluginKey}${menuTo}`,
    };
  });
  menus.profileMenu = menus.profileMenu.map(menu => {
    if(!menu.to) return menu;
    if(menu.to.startsWith('http')) return menu; // External link
    if(menu.to.startsWith('@/')){ // Link to a page in the administration
      return {
        ...menu,
        to: menu.to.slice(1),
      };
    }
    var menuTo = menu.to.startsWith('/') ? menu.to : `/${menu.to}`;
    menuTo = menuTo.startsWith('@PV/') ? menuTo.slice(4) : menuTo;
    return {
      ...menu,
      to: `/p/${ctx.pluginKey}${menuTo}`,
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
            // relativePath: itemPath.replace(path.join(ctx.pluginDir, 'adminUI', ctx.pluginKey), ''),
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

const getAdminUIPartials = (ctx) => {
  // Loading the partials
  const partialsFolder = path.join(ctx.pluginDir, 'adminUI', 'partials');
  const partials = [];

  // Loading the partials recursively
  const loadpartials = (ctx, folder) => {
    // Get the folder content
    const folderContent = fs.readdirSync(folder);
    // Iterate over the folder content
    folderContent.forEach((item) => {
      // Get the item path
      const itemPath = path.join(folder, item);

      // Check if the item is a folder
      if (fs.lstatSync(itemPath).isDirectory()) {
        return null;
      } else {
        // If the item is a file, then check if it's a partial (ends with .vue)
        if (item.endsWith('.vue')) {
          // If item size is 9 bytes or less, then it's an empty file, so ignore it
          const itemState = fs.statSync(itemPath);
          if(itemState.size <= 9) return null;
          const partial = {
            component: itemPath.replace(path.join(ctx.pluginDir, 'adminUI'), '').replace(/\\/g, '/'),
            updated: false,
            name: '',
            key: item.slice(0, -4), // Remove the .vue extension
          };
          partial.name = ctx.helpers.slugify(ctx.pluginKey+partial.component).replace(/-/g, '_');
          const cache_updated_date = ctx.cache.get(`adminui_partial_${partial.component}_updated`);
          const updated_date = itemState.mtime.getTime();
          partial.updated = (cache_updated_date !== updated_date);
          if(partial.updated) ctx.cache.set(`adminui_partial_${partial.component}_updated`, updated_date);
          
          partials.push(partial);
        }
      }
    });
  };

  loadpartials(ctx, partialsFolder);
  return partials;
};

const getAdminUIScripts = (ctx) => {
  // Loading the scripts
  const scriptsFolder = path.join(ctx.pluginDir, 'adminUI', 'scripts');
  const scripts = {};

  // Loading the scripts recursively
  const loadScripts = (ctx, folder) => {
    // Get the folder content
    const folderContent = fs.readdirSync(folder);
    // Iterate over the folder content
    folderContent.forEach((item) => {
      // Get the item path
      const itemPath = path.join(folder, item);

      // Check if the item is a folder
      if (fs.lstatSync(itemPath).isDirectory()) {
        return null;
      } else {
        // If the item is a file, then check if it's a script (ends with .js)
        if (item.endsWith('.js')) {
          // If item size is 9 bytes or less, then it's an empty file, so ignore it
          const itemState = fs.statSync(itemPath);
          if(itemState.size <= 9) return null;
          var script = fs.readFileSync(itemPath, 'utf8');
          const scriptName = item.slice(0, -3); // Remove the .js extension
          const replaceInCode = (code) => {
            var newCode = code.replace(/@PS\//g, `/api/plugins_static/${ctx.pluginKey}/`);
            // Plugins API links
            newCode = newCode.replace(/@PA\//g, `/api/plugin_api/${ctx.pluginKey}/`);
            // Plugins VueJS links
            newCode = newCode.replace(/@PV\//g, `/p/${ctx.pluginKey}/`);
            return newCode;
          };
          script = replaceInCode(script);
          scripts[scriptName] = script;
        }
      }
    });
  };

  loadScripts(ctx, scriptsFolder);
  return scripts;
};


module.exports = async (ctx) => {

  // var lastUpdates = ctx.cache.get('adminui_last_updates');

  // Retrieve the configuration for the admin UI
  const adminUIConfig = getAdminUIConfig(ctx);

  // Retrieve the menus for the admin UI
  const adminUIMenus = getAdminUIMenus(ctx);

  // Retrieve the store for the admin UI
  const adminUIStore = getAdminUIStore(ctx);

  // Retrieve the scripts for the admin UI
  const adminUIScripts = getAdminUIScripts(ctx);

  // Retrieve the pages
  const adminUIPages = getAdminUIPages(ctx);

  // Generate the pages routes and dynamic routes
  // Only if there are changes do compile
  const recompilePages = ctx.cache.get('adminui_pages_compiled_error') || (adminUIPages.filter((page) => page.updated).length > 0);
  var compiledPages;
  if (recompilePages) {
    ctx.cache.set('adminui_pages_compiled_error', true); // So if the compilation fails, it will automatically gets flagged as an error
    ctx.helpers.log('Admin UI pages compilation started', 'info');
    // Compile the pages
    compiledPages = await compilePagesVue(ctx, adminUIPages);
    if(!compiledPages){
      ctx.helpers.log('Admin UI pages compilation failed', 'error');
      process.exit(1);
    }
    // Save the last updates
    ctx.cache.set('adminui_compiled_pages', compiledPages);
    ctx.cache.set('adminui_pages_compiled_error', false);
  } else {
    // Load the last updates
    compiledPages = ctx.cache.get('adminui_compiled_pages');
  }

  // Retrieve the partials
  const adminUIPartials = getAdminUIPartials(ctx);

  // Generate the partials routes and dynamic routes
  // Only if there are changes do compile
  const recompilePartials = ctx.cache.get('adminui_partials_compiled_error') || (adminUIPartials.filter((page) => page.updated).length > 0);
  var compiledPartials;
  if (recompilePartials) {
    ctx.cache.set('adminui_partials_compiled_error', true); // So if the compilation fails, it will automatically gets flagged as an error
    ctx.helpers.log('Admin UI partials compilation started', 'info');
    // Compile the partials
    compiledPartials = await compilePartialsVue(ctx, adminUIPartials);
    if(!compiledPartials){
      ctx.helpers.log('Admin UI partials compilation failed', 'error');
      process.exit(1);
    }
    // Save the last updates
    ctx.cache.set('adminui_compiled_partials', compiledPartials);
    ctx.cache.set('adminui_partials_compiled_error', false);
  } else {
    // Load the last updates
    compiledPartials = ctx.cache.get('adminui_compiled_partials');
  }

  return {
    config: adminUIConfig,
    menus: adminUIMenus,
    store: adminUIStore,
    pages: adminUIPages,
    compiled: compiledPages,
    compiledPartials: compiledPartials,
    scripts: adminUIScripts,
  };

};