const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');
const { compilePagesVue } = require('./build_pages_vue');
const { compilePublicPagesVue } = require('./build_public_pages_vue');
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

  // Replace the links with the correct paths
  const replaceLinksWithCorrectPaths = (link) => {
    if(!link) return link;
    if(link.startsWith('http')) return link; // External link
    if(link.startsWith('@/')){ // Link to a page in the administration
      return link.slice(1); // Remove the @
    }
    var menuTo = (link.startsWith('/') || link.startsWith('@')) ? link : `/${link}`;
    if(menuTo.startsWith('@PV/')){
      menuTo = menuTo.slice(4);
      return `/p/${ctx.pluginKey}/${menuTo}`;
    }
    if(menuTo.startsWith('@PVP/')){
      menuTo = menuTo.slice(5);
      return `/public/${ctx.pluginKey}/${menuTo}`;
    }
    return `/p/${ctx.pluginKey}/${menuTo}`;
  };

  menus.mainMenu = menus.mainMenu.map(_menu => {
    var menu = {
      ..._menu,
      to: replaceLinksWithCorrectPaths(_menu.to),
    };
    if(menu.subitems && menu.subitems.length > 0){
      menu.subitems = menu.subitems.map(_subitem => {
        var subitem = {
          ..._subitem,
          to: replaceLinksWithCorrectPaths(_subitem.to),
        };
        return subitem;
      });
    }
    return menu;
  });
  menus.profileMenu = menus.profileMenu.map(menu => {
    return {
      ...menu,
      to: replaceLinksWithCorrectPaths(menu.to),
    };
  });
  return menus;
};

const getAdminUIStore = (ctx) => {
  const storeFile = path.join(ctx.pluginDir, 'adminUI', 'store.js');
  const storeContent = fs.readFileSync(storeFile, 'utf8');
  return storeContent;
};

const getAdminUIComponents = (ctx, pages, partials) => {
  // Example of reading a page or a partial file
  // const pageFile = path.join(ctx.pluginDir, 'adminUI', pages[0].component);

  // Extract the components imported by a component
  const extractComponentDependencies = (componentPath, ignoreList, level = 0) => {
    const tabs = Array(level).fill('  ').join('');
    // console.log(tabs+"  > Extracting dependencies for component: ", componentPath);
    if(ignoreList && ignoreList.has(componentPath)){
      // console.log(tabs+"    - Ignoring component: ", componentPath);
      return new Set();
    }
    const componentFile = path.join(ctx.pluginDir, 'adminUI', 'components', componentPath);
    const componentContent = fs.readFileSync(componentFile, 'utf-8');
    
    const regex = /import\s+\w+\s+from\s+(["'])(.*?)(\/(.*?)\.vue)?(["'])/g;

    const dependencies = new Set();
    let match;
    // console.log("    - Total dependencies matches: ", (componentContent.match(regex) || []).length);
    while ((match = regex.exec(componentContent)) !== null) {
      var dependency;
      var dependencyImportStatement = match[0].replace(/['"]+/g, '').replace(/;+/g, '').trim(); // to replace all the quotes and semicolons and trim
      if(dependencyImportStatement.includes('@/')){
        dependency = dependencyImportStatement.split('@/components/')[1];
      } else {
        dependency = dependencyImportStatement.split('from ')[1];
        dependency = dependency.replace(/['"]+/g, '').replace(/;+/g, '').trim();
        dependency = path.join(path.dirname(componentFile), dependency);
        dependency = path.relative(path.join(ctx.pluginDir, 'adminUI', 'components'), dependency);
      }
      dependencies.add(dependency);
      const subDependencies = extractComponentDependencies(
        dependency,
        dependencies,
        level +1
      );
      subDependencies.forEach((subDependency) => dependencies.add(subDependency));
    }

    return dependencies;
  };


  // Extract imported components from a folder
  const extractImports = (folder) => {
    // console.log("Extracting imports from folder: ", folder);
    const imports = new Set();
    const folderContent = fs.readdirSync(folder);

    folderContent.forEach((item) => {
      const itemPath = path.join(folder, item);
      // console.log("  - Item: ", itemPath);

      // Check if the item is a folder, and recurse if so
      if (fs.lstatSync(itemPath).isDirectory()) {
        const subImports = extractImports(itemPath);
        subImports.forEach((importedComponent) => imports.add(importedComponent));
      } else if (item.endsWith('.vue')) {
        // Read the file content
        const content = fs.readFileSync(itemPath, 'utf-8');
        // Use regex to extract all the import paths
        const regex = /import\s+\w+\s+from\s+(["'])@\/components\/(.*?)\.vue(["'])/g;
        let match;
        // console.log("- Total imports matches: ", (content.match(regex) || []).length);
        while ((match = regex.exec(content)) !== null) {
          const componentPath = match[2].replace(/['"]+/g, '').replace(/;+/g, '').trim()+'.vue';
          imports.add(componentPath);
          const importDependencies = extractComponentDependencies(componentPath);
          importDependencies.forEach((importedComponent) => imports.add(importedComponent));
        }
      }
    });

    return imports;
  };

  // Loading the components
  const componentsFolder = path.join(ctx.pluginDir, 'adminUI', 'components');
  const pagesFolder = path.join(ctx.pluginDir, 'adminUI', 'pages');
  const public_pagesFolder = path.join(ctx.pluginDir, 'adminUI', 'public_pages');
  const partialsFolder = path.join(ctx.pluginDir, 'adminUI', 'partials');

  const components = [];

  // Extract all components imported by pages and partials
  const pageImports = extractImports(pagesFolder);
  const public_pageImports = extractImports(public_pagesFolder);
  const partialImports = extractImports(partialsFolder);

  // Loading the components recursively
  const loadComponents = (ctx, folder) => {
    // Get the folder content
    const folderContent = fs.readdirSync(folder);
    // Iterate over the folder content
    folderContent.forEach((item) => {
      // Get the item path
      const itemPath = path.join(folder, item);

      // Check if the item is a folder
      if (fs.lstatSync(itemPath).isDirectory()) {
        // If the item is a folder, then load the components from the folder
        loadComponents(ctx, itemPath);
      } else {
        // If the item is a file, then check if it's a component (ends with .vue)
        if (item.endsWith('.vue')) {
          // If item size is 9 bytes or less, then it's an empty file, so ignore it
          const itemState = fs.statSync(itemPath);
          if(itemState.size <= 9) return;
          const componentRelPath = itemPath.replace(path.join(ctx.pluginDir, 'adminUI', 'components'), '').replace(/\\/g, '/').slice(1);
          const component = {
            component: itemPath.replace(path.join(ctx.pluginDir, 'adminUI'), '').replace(/\\/g, '/'),
            updated: false,
            name: '',
            importedByPages: pageImports.has(componentRelPath),
            importedByPublicPages: public_pageImports.has(componentRelPath),
            importedByPartials: partialImports.has(componentRelPath),
            // relativePath: itemPath.replace(path.join(ctx.pluginDir, 'adminUI', ctx.pluginKey), ''),
          };
          component.name = ctx.helpers.slugify(ctx.pluginKey+component.component).replace(/-/g, '_');
          const cache_updated_date = ctx.cache.get(`adminui_component_${component.component}_updated`);
          const updated_date = itemState.mtime.getTime();
          component.updated = (cache_updated_date !== updated_date);
            
          if(component.updated) ctx.cache.set(`adminui_component_${component.component}_updated`, updated_date);
          components.push(component);
        }
      }
    });
  };

  loadComponents(ctx, componentsFolder);
  return components;
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
  var pages = [];

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

          // Check if the page's imported "js" "css" or "json" files are updated
          // console.log('Checking page: ', page.component);
          const regexJs = /import\s+\w+\s+from\s+(["'])(.*?)(\/(.*?)\.js)(["'])/g;
          const regexCss = /import\s+\w+\s+from\s+(["'])(.*?)(\/(.*?)\.css)(["'])/g;
          const regexJson = /import\s+\w+\s+from\s+(["'])(.*?)(\/(.*?)\.json)(["'])/g;
          const pcontent = fs.readFileSync(itemPath, 'utf-8');
          const regexChecker = (regex, content, ext) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
              var rFile = match[0].replace(/['"]+/g, '').replace(/;+/g, '').trim().split(' ');
              rFile = rFile[rFile.length-1];
              var rFilePath;
              if(rFile.startsWith('@/')) {
                rFilePath = path.join(ctx.pluginDir, 'adminUI', rFile.slice(2));
              } else {
                rFilePath = path.join(path.dirname(itemPath), rFile);
              }
              if(!fs.existsSync(rFilePath)) continue;
              const rFileState = fs.statSync(rFilePath);
              const cache_updated_date = ctx.cache.get(`adminui_page_`+ext+`_${rFilePath}_updated`);
              const updated_date = rFileState.mtime.getTime();
              if(cache_updated_date !== updated_date){
                ctx.cache.set(`adminui_page_`+ext+`_${rFilePath}_updated`, updated_date);
                page.updated = true;
              }
            }
          };
          const uncommentedContent = pcontent.replace(/\/\/.*/g, '').replace(/\/\*.*\*\//g, '');
          regexChecker(regexJs, uncommentedContent, 'js');
          regexChecker(regexCss, uncommentedContent, 'css');
          regexChecker(regexJson, uncommentedContent, 'json');
          
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

  // Sort pages so the ones with page.route.includes(':') are last
  pages.sort((a, b) => {
    if (a.route.includes(':') && !b.route.includes(':')) return 1;
    if (!a.route.includes(':') && b.route.includes(':')) return -1;
    return 0;
  });
  
  return pages;
};

const getAdminUIPublicPages = (ctx) => {
  // The pages are loaded from the pages folder and it's subfolders, and the routes are generated from the folder structure
  // Use a recursive function to load the pages
  // Routes should follow the NuxtJS routes structure
  // If there is a _slug.vue file, then the name `slug` should be a parameter in the route
  // If there is an index.vue file, then the route should be the folder name
  // If there is a _slug/index.vue file, then the name `slug` should be a parameter in the route and the route should be the folder name
  // If there is a _slug/_id.vue file, then the name `slug` should be a parameter in the route and the name `id` should be a parameter in the route

  // Loading the pages
  const pagesFolder = path.join(ctx.pluginDir, 'adminUI', 'public_pages');
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

  if(!fs.existsSync(scriptsFolder)) return scripts;

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
            // Plugins Key
            newCode = newCode.replace(/@PK/g, `${ctx.pluginKey}`);
            // Plugins API links
            newCode = newCode.replace(/@PA\//g, `/api/plugin_api/${ctx.pluginKey}/`);
            // Plugins VueJS links
            newCode = newCode.replace(/@PV\//g, `/p/${ctx.pluginKey}/`);
            // Plugins VueJS public links
            newCode = newCode.replace(/@PVP\//g, `/public/${ctx.pluginKey}/`);
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

  // Retrieve the public pages
  const adminUIPublicPages = getAdminUIPublicPages(ctx);

  // Retrieve the partials
  const adminUIPartials = getAdminUIPartials(ctx);

  // Cache last updates for components
  const adminUIComponents = getAdminUIComponents(ctx, adminUIPages, adminUIPartials);

  // Generate the pages routes and dynamic routes
  // Check if there are changes in the components
  const pagesComponentsAreUpdated = (adminUIComponents.filter((component) => (component.importedByPages && component.updated)).length > 0);
  const partialsComponentsAreUpdated = (adminUIComponents.filter((component) => (component.importedByPartials && component.updated)).length > 0);
  const publicPagesComponentsAreUpdated = (adminUIComponents.filter((component) => (component.importedByPublicPages && component.updated)).length > 0);
  // Only if there are changes do compile
  const recompilePages = ctx.cache.get('adminui_pages_compiled_error') || (adminUIPages.filter((page) => page.updated).length > 0) || pagesComponentsAreUpdated;
  var compiledPages;
  if (recompilePages) {
    ctx.cache.set('adminui_pages_compiled_error', true); // So if the compilation fails, it will automatically gets flagged as an error
    ctx.helpers.log('Admin UI pages compilation started', 'info');
    // Compile the pages
    compiledPages = await compilePagesVue(ctx, adminUIPages, adminUIComponents);
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

  // Generate the public pages routes and dynamic routes
  // Only if there are changes do compile
  const recompilePublicPages = ctx.cache.get('adminui_public_pages_compiled_error') || (adminUIPublicPages.filter((page) => page.updated).length > 0) || publicPagesComponentsAreUpdated;
  var compiledPublicPages;
  if (recompilePublicPages) {
    ctx.cache.set('adminui_public_pages_compiled_error', true); // So if the compilation fails, it will automatically gets flagged as an error
    ctx.helpers.log('Admin UI public pages compilation started', 'info');
    // Compile the public pages
    compiledPublicPages = await compilePublicPagesVue(ctx, adminUIPublicPages, adminUIComponents);
    if(!compiledPublicPages){
      ctx.helpers.log('Admin UI public pages compilation failed', 'error');
      process.exit(1);
    }
    // Save the last updates
    ctx.cache.set('adminui_compiled_public_pages', compiledPublicPages);
    ctx.cache.set('adminui_public_pages_compiled_error', false);
  } else {
    // Load the last updates
    compiledPublicPages = ctx.cache.get('adminui_compiled_public_pages');
  }

  // Generate the partials routes and dynamic routes
  // Only if there are changes do compile
  const recompilePartials = ctx.cache.get('adminui_partials_compiled_error') || (adminUIPartials.filter((page) => page.updated).length > 0) || partialsComponentsAreUpdated;
  var compiledPartials;
  if (recompilePartials) {
    ctx.cache.set('adminui_partials_compiled_error', true); // So if the compilation fails, it will automatically gets flagged as an error
    ctx.helpers.log('Admin UI partials compilation started', 'info');
    // Compile the partials
    compiledPartials = await compilePartialsVue(ctx, adminUIPartials, adminUIComponents);
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
    publicPages: adminUIPublicPages,
    compiled: compiledPages,
    compiledPartials: compiledPartials,
    compiledPublicPages: compiledPublicPages,
    scripts: adminUIScripts,
  };

};