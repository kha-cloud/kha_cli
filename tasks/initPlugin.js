const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

function snakeCase(str) {
  return str.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();})
          .replace(/^_/, "") // Remove first underscore
          .replace(/_$/, "") // Remove last underscore
          .replace(/-+/g, "_")
          .replace(/__+/g, "_") // Replace multiple underscores with one
          .replace(/\s+/g, '')
          .replace(/[^a-zA-Z0-9_]/g, '');
}

module.exports = async (ctx, isFixInit = false, initCustomCommand) => {

  // ===========================================================================================
  //                                        PLUGIN CREATION
  // ===========================================================================================

  const isCustomInit = isFixInit || initCustomCommand;

  // Ask for the plugin name
  const pluginName = isCustomInit || await inquirer.prompt({
    type: 'input',
    name: 'pluginName',
    message: 'What is the name of the plugin?',
    default: ctx.helpers.unSlugify(path.basename(ctx.pluginDir))
  });

  // Ask for the plugin key (suggesting the plugin name in snake_case)
  const pluginKey = isCustomInit || await inquirer.prompt({
    type: 'input',
    name: 'pluginKey',
    message: 'What is the key of the plugin?',
    default: snakeCase(pluginName.pluginName)
  });

  // Ask for the plugin description
  const pluginDescription = isCustomInit || await inquirer.prompt({
    type: 'input',
    name: 'pluginDescription',
    message: 'What is the description of the plugin?',
    default: 'A plugin for the KhaCloud platform'
  });

  // Create the `plugin.jsonc`
  const pluginJsonc = isCustomInit || {
    engine_version: "2",
    pluginVersion: '0.0.1',
    name: pluginName.pluginName,
    key: pluginKey.pluginKey,
    description: pluginDescription.pluginDescription,
    icon: "",
    permissions: {},
  };
  if(!isCustomInit){
    fs.writeFileSync(path.join(ctx.pluginDir, 'plugin.jsonc'), JSON.stringify(pluginJsonc, null, 2));

    // Create the cache/dist folder
    fs.mkdirSync(path.join(ctx.pluginDir, '.cache'));
    fs.mkdirSync(path.join(ctx.pluginDir, '.cache', 'dist'));
  }

  // ===========================================================================================
  //                                        API DATA
  // ===========================================================================================

  // Ask for the App's url (Optional)
  const appUrl = isCustomInit || await inquirer.prompt({
    type: 'input',
    name: 'appUrl',
    message: 'What is the url of the app (Optional)?',
    default: 'https://my-website.com'
  });

  // Ask for the App's token (Optional)
  const appToken = isCustomInit || await inquirer.prompt({
    type: 'input',
    name: 'appToken',
    message: 'What is the token of the app (Optional)?',
    default: '<your-auth-token>'
  });

  // Ask for the OpenAi's token (Optional)
  const openAiToken = isCustomInit || await inquirer.prompt({
    type: 'input',
    name: 'openAiToken',
    message: 'What is the token for OpenAi (Optional)?',
    default: '<OPTIONAL-your-openai-token>'
  });

  // Create the `kha-plugin-config.jsonc`
  const khaPluginConfigJsonc = isCustomInit || {
    url: appUrl.appUrl,
    token: appToken.appToken,
    openai_key: openAiToken.openAiToken,
    cyberocean_marketplace_plugin_id: null,
  };
  if(!isCustomInit){
    fs.writeFileSync(path.join(ctx.pluginDir, 'kha-plugin-config.jsonc'), JSON.stringify(khaPluginConfigJsonc, null, 2));
  }

  // ===========================================================================================
  //                                        OPTIONAL PARTS
  // ===========================================================================================
  const makeDir = (path) => {
    if(fs.existsSync(path)) return false;
    fs.mkdirSync(path);
    return true;
  };
  const makeFile = (path, content) => {
    if(fs.existsSync(path)) return false;
    fs.writeFileSync(path, content);
    return true;
  };
  const dirDoNotExist_or_isFixInit_or_isCustomInitCommand = (folderName) => {
    if(initCustomCommand) {
      return (initCustomCommand == folderName);
    }
    return !fs.existsSync(path.join(ctx.pluginDir, folderName)) || isFixInit;
  };
  const isFixInit_or_customCommand = (folderName, key) => {
    if(isFixInit || (initCustomCommand == folderName)) {
      return {
        [key]: true
      };
    };
    return false;
  };

  // -------------------------------------------------------------------- adminUI
  if(dirDoNotExist_or_isFixInit_or_isCustomInitCommand('adminUI')){
    // Ask if the plugin has an admin UI
    const hasAdminUi = isFixInit_or_customCommand("adminUI", "hasAdminUi") || await inquirer.prompt({
      type: 'confirm',
      name: 'hasAdminUi',
      message: 'Does the plugin have an admin UI?'
    });
  
    if (isFixInit_or_customCommand("adminUI", "hasAdminUi") || hasAdminUi.hasAdminUi) {
      // Folders
      makeDir(path.join(ctx.pluginDir, 'static'));
      makeDir(path.join(ctx.pluginDir, 'adminUI'));
      makeDir(path.join(ctx.pluginDir, 'adminUI', 'pages'));
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'pages', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'adminUI', 'public_pages'));
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'public_pages', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'adminUI', 'components'));
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'components', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'adminUI', 'partials'));
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'partials', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'adminUI', 'scripts'));
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'scripts', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'adminUI', 'utils'));
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'utils', '.gitkeep'), '');

      // Files
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'config.jsonc'), "{}");
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'menus.jsonc'), `{\n  "mainMenu": [\n  ],\n  "profileMenu": [\n  ],\n  "hideMainMenu": [\n  ],\n  "hideProfileMenu": [\n  ]\n}`);
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'store.js'),
      `module.exports = {\n`+
      `  namespaced: true,\n`+
      `  state: () => ({\n`+
      `  }),\n`+
      `  mutations: {\n`+
      `  },\n`+
      `  actions: {\n`+
      `  },\n`+
      `  getters: {\n`+
      `  },\n`+
      `};\n`+
      ``);
    }
  }

  // -------------------------------------------------------------------- api
  if(dirDoNotExist_or_isFixInit_or_isCustomInitCommand('api')){
    // Ask if the plugin has an api
    const hasApi = isFixInit_or_customCommand("api", "hasApi") || await inquirer.prompt({
      type: 'confirm',
      name: 'hasApi',
      message: 'Does the plugin have an api?'
    });

    if (isFixInit_or_customCommand("api", "hasApi") || hasApi.hasApi) {
      // Folders
      makeDir(path.join(ctx.pluginDir, 'api'));
      makeDir(path.join(ctx.pluginDir, 'api', 'controllers'));
      makeFile(path.join(ctx.pluginDir, 'api', 'controllers', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'api', 'middlewares'));
      makeFile(path.join(ctx.pluginDir, 'api', 'middlewares', 'example.js.backup'), 'module.exports = {\n  routes: ["/"],\n  function: /* js */ \`\n    ctx.originalUrl = "/p/home";\n    ctx.url = "/p/home";\n    \n    // next(false);\n    // return utils.liquidView("home");\n  \`\n};');

      // Files
      makeFile(path.join(ctx.pluginDir, 'api', 'io.js'), `// Code directly here\n// Available variables ctx, socket, global_data, Store, ObjectId\n\n`);
      makeFile(path.join(ctx.pluginDir, 'api', 'routes.js'), `module.exports = [\n];`);
      makeFile(path.join(ctx.pluginDir, 'api', 'hooks.js'), `module.exports = [\n];`);
    }
  }

  // -------------------------------------------------------------------- web
  if(dirDoNotExist_or_isFixInit_or_isCustomInitCommand('web')){
    // Ask if the plugin has a web
    const hasWeb = isFixInit_or_customCommand("web", "hasWeb") || await inquirer.prompt({
      type: 'confirm',
      name: 'hasWeb',
      message: 'Does the plugin have a web implementation?'
    });

    if (isFixInit_or_customCommand("web", "hasWeb") || hasWeb.hasWeb) {
      // Folders
      makeDir(path.join(ctx.pluginDir, 'web'));
      makeDir(path.join(ctx.pluginDir, 'web', 'templates'));
      // makeFile(path.join(ctx.pluginDir, 'web', 'templates', '.gitkeep'), '');
      makeFile(path.join(ctx.pluginDir, 'web', 'templates', 'layout.liquid'), `\n<html>\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Website</title>\n  </head>\n  <body>\n    {% section '@PK_header.liquid' %}\n    {{ content_for_layout }}\n    {% section '@PK_footer.liquid' %}\n  </body>\n</html>\n`);
      makeDir(path.join(ctx.pluginDir, 'web', 'sections'));
      // makeFile(path.join(ctx.pluginDir, 'web', 'sections', '.gitkeep'), '');
      makeFile(path.join(ctx.pluginDir, 'web', 'sections', 'header.liquid'), 'THIS IS THE HEADER');
      makeFile(path.join(ctx.pluginDir, 'web', 'sections', 'footer.liquid'), 'THIS IS THE FOOTER');

      // Files
      makeFile(path.join(ctx.pluginDir, 'web', 'routes.js'), `module.exports = [\n];`);
    }

    // Ask if the plugin has a vue web
    const hasVueWeb = (isFixInit_or_customCommand("web", "hasWeb") || hasWeb.hasWeb) && (isFixInit_or_customCommand("web", "hasVueWeb") || await inquirer.prompt({
      type: 'confirm',
      name: 'hasVueWeb',
      message: 'Does the plugin have a VueJS web app?',
      default: false
    }));

    if ((isFixInit_or_customCommand("web", "hasWeb") || hasWeb.hasWeb) && hasVueWeb.hasVueWeb) {
      // Create Vue folders
      makeDir(path.join(ctx.pluginDir, 'web', 'vue-app'));
      makeDir(path.join(ctx.pluginDir, 'web', 'vue-app', 'components'));
      makeDir(path.join(ctx.pluginDir, 'web', 'vue-app', 'plugins'));
      makeDir(path.join(ctx.pluginDir, 'web', 'vue-app', 'pages'));
      makeDir(path.join(ctx.pluginDir, 'web', 'vue-app', 'layouts'));
      makeDir(path.join(ctx.pluginDir, 'web', 'vue-app', 'store'));
      makeDir(path.join(ctx.pluginDir, 'web', 'vue-app', 'static'));
      

      // Create Vue files
      makeFile(path.join(ctx.pluginDir, 'web', 'vue-app', 'plugins', 'axios.js'), 'export default function ({ $axios }) {\n  const devDomain = \"https:\/\/cyberocean.net\";\n  const isProduction =  process.env.NODE_ENV === \'production\';\n  const selectedDomain = isProduction? \'https:\/\/\' + window.location.hostname  : devDomain ;\n\n  $axios.onRequest(config => {\n      \/\/ Check if the URL contains \/api\/\n      if (config.url && config.url.includes(\'\/api\/\')) {\n        \/\/ If it\'s a relative URL, prepend the custom domain\n        if (config.url.startsWith(\'\/api\/\')) {\n          config.url = `${selectedDomain}${config.url}`;\n        }\n        \/\/ If it\'s already an absolute URL containing \/api\/, you might want to replace the base\n        else if (config.url.includes(\'localhost\') && config.url.includes(\'\/api\/\')) {\n          config.url = config.url.replace(\/https?:\\\/\\\/localhost(:\\d+)?\/, selectedDomain);\n        }\n      }\n      return config;\n    });\n}\n');
      makeFile(path.join(ctx.pluginDir, 'web', 'vue-app', 'package.json'), '{\n  \"name\": \"cyberocean-web-app\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"dev\": \"node --max-old-space-size=2048 node_modules\/.bin\/nuxt\",\n    \"build\": \"node --max-old-space-size=2048 node_modules\/.bin\/nuxt build\",\n    \"start\": \"nuxt start\",\n    \"generate\": \"nuxt generate\"\n  },\n  \"dependencies\": {\n    \"@nuxtjs\/axios\": \"^5.13.6\",\n    \"core-js\": \"^3.6.5\",\n    \"nuxt\": \"^2.15.8\"\n  },\n  \"devDependencies\": {\n    \"@babel\/plugin-proposal-optional-chaining\": \"^7.21.0\",\n    \"@babel\/plugin-transform-optional-chaining\": \"^7.27.1\",\n    \"autoprefixer\": \"^9.8.6\",\n    \"vue-template-babel-compiler\": \"^2.0.0\"\n  },\n  \"overrides\": {\n   \"postcss\": \"8.4.19\"\n  }\n}');
      makeFile(path.join(ctx.pluginDir, 'web', 'vue-app', 'nuxt.config.js'), 'const isProduction =  process.env.NODE_ENV === \'production\';\n\nexport default {\n  \/\/ Target (https:\/\/go.nuxtjs.dev\/config-target)\n  target: \"static\",\n  ssr: false,\n  mode: \'spa\',\n\n  router: {\n    base: isProduction ? \'\/w\/\' : \'\/\'\n    \/\/ base: \'\/p\/web\/\'\n  },\n  \n  \/\/ Global page headers (https:\/\/go.nuxtjs.dev\/config-head)\n  head: {\n    title: \"Cyberocean\",\n    meta: [\n      { charset: \"utf-8\" },\n      { name: \"viewport\", content: \"width=device-width, initial-scale=1\" },\n      { hid: \"name\", name: \"name\", content: \"Cyberocean\" }\n    ],\n    link: [{ rel: \"icon\", type: \"image\/x-icon\", href: \"\/favicon.png\" }]\n  },\n\n  \/\/ Global CSS (https:\/\/go.nuxtjs.dev\/config-css)\n  css: [],\n\n  \/\/ Plugins to run before rendering page (https:\/\/go.nuxtjs.dev\/config-plugins)\n  plugins: [\n    \'~\/plugins\/axios\',\n  ],\n\n  \/\/ Auto import components (https:\/\/go.nuxtjs.dev\/config-components)\n  components: true,\n\n  \/\/ Modules for dev and build (recommended) (https:\/\/go.nuxtjs.dev\/config-modules)\n  buildModules: [],\n\n  \/\/ Modules (https:\/\/go.nuxtjs.dev\/config-modules)\n  modules: [\n    \'@nuxtjs\/axios\'\n  ],\n  \/\/ Axios module configuration (https:\/\/axios.nuxtjs.org\/options)\n  axios: {\n    \/\/ We\'ll set baseURL dynamically in the plugin\n    baseURL: isProduction? undefined : \'https:\/\/cyberocean.net\',\n    \/\/ Enable CORS\n    credentials: false,\n    proxy: false\n  },\n\n  \/\/ Build Configuration (https:\/\/go.nuxtjs.dev\/config-build)\n  build: {\n    babel: {\n      plugins: [\n        \'@babel\/plugin-transform-optional-chaining\'\n      ]\n    },\n    extend(config, { isClient, isServer, loaders: { vue } }) {\n      \/\/ Replace the default template compiler with the babel compiler that supports modern JS\n      vue.compiler = require(\'vue-template-babel-compiler\')\n    }\n  },\n\n  \/\/ Generate configuration\n  generate: {\n    dir: \'..\/..\/static\/vue-app\',\n    crawler: false,\n    \/\/ Fallback to SPA mode\n    fallback: true,\n    \/\/ Only generate the index page since we\'re running in SPA mode\n    routes: [\'\/\'],\n    exclude: [\n      \/\/ Regex to exclude all routes, except the index page\n      \/(.*)\/,\n    ]\n  }\n};\n');
      makeFile(path.join(ctx.pluginDir, 'web', 'vue-app', 'layouts', 'default.vue'), '<template>\n  <div>\n    <Nuxt \/>\n  <\/div>\n<\/template>\n\n<script>\nexport default {\n  head() {\n    return {\n      title: \'Vue App\',\n      meta: [\n        { charset: \'utf-8\' },\n        { name: \'viewport\', content: \'width=device-width, initial-scale=1\' },\n        { hid: \'name\', name: \'name\', content: \'Vue App\' },\n      ],\n      link: [\n        { rel: \'icon\', type: \'image\/x-icon\', href: \'\/favicon.ico\' }\n      ]\n    }\n  },\n\n}\n<\/script>\n\n<style>\n<\/style>\n');
      makeFile(path.join(ctx.pluginDir, 'web', 'vue-app', 'pages', 'index.vue'), '<template>\n  <div>\n    Welcome to Vue App\n  <\/div>\n<\/template>\n\n<script>\nexport default {\n}\n<\/script>\n\n<style scoped>\n<\/style>\n');
      makeFile(path.join(ctx.pluginDir, 'web', 'vue-app', '.gitignore'), '# Created by .ignore support plugin (hsz.mobi)\n### Node template\n# Logs\n\/logs\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n\n# Runtime data\npids\n*.pid\n*.seed\n*.pid.lock\n\n# Directory for instrumented libs generated by jscoverage\/JSCover\nlib-cov\n\n# Coverage directory used by tools like istanbul\ncoverage\n\n# nyc test coverage\n.nyc_output\n\n# Grunt intermediate storage (http:\/\/gruntjs.com\/creating-plugins#storing-task-files)\n.grunt\n\n# Bower dependency directory (https:\/\/bower.io\/)\nbower_components\n\n# node-waf configuration\n.lock-wscript\n\n# Compiled binary addons (https:\/\/nodejs.org\/api\/addons.html)\nbuild\/Release\n\n# Dependency directories\nnode_modules\/\njspm_packages\/\n\n# TypeScript v1 declaration files\ntypings\/\n\n# Optional npm cache directory\n.npm\n\n# Optional eslint cache\n.eslintcache\n\n# Optional REPL history\n.node_repl_history\n\n# Output of \'npm pack\'\n*.tgz\n\n# Yarn Integrity file\n.yarn-integrity\n\n# dotenv environment variables file\n.env\n\n# parcel-bundler cache (https:\/\/parceljs.org\/)\n.cache\n\n# next.js build output\n.next\n\n# nuxt.js build output\n.nuxt\n\n# Nuxt generate\ndist\n\n# vuepress build output\n.vuepress\/dist\n\n# Serverless directories\n.serverless\n\n# IDE \/ Editor\n.idea\n\n# Service worker\nsw.*\n\n# macOS\n.DS_Store\n.AppleDouble\n.LSOverride\n\n# Icon must end with two \\r\nIcon\n\n\n# Thumbnails\n._*\n\n# Files that might appear in the root of a volume\n.DocumentRevisions-V100\n.fseventsd\n.Spotlight-V100\n.TemporaryItems\n.Trashes\n.VolumeIcon.icns\n.com.apple.timemachine.donotpresent\n\n# Directories potentially created on remote AFP share\n.AppleDB\n.AppleDesktop\nNetwork Trash Folder\nTemporary Items\n.apdisk\n\n# Vim swap files\n*.swp\n\n.editorconfig\n');
      
      // Create Extra files
      makeFile(path.join(ctx.pluginDir, 'kha-pre-install.sh'), 'cd web/vue-app\n./node_modules/nuxt/bin/nuxt.js generate\n');
      makeFile(path.join(ctx.pluginDir, 'api', 'middlewares', 'vue-app.js'), 'module.exports = {\n  routes: [\"\/\", \"\/w\/*\"],\n  function: \/* js *\/ `\n    if(ctx.originalUrl.startsWith(\"\/w\/\")) {\n      ctx.originalUrl = ctx.originalUrl.replace(\"\/w\/\", \"\/p\/web\/\");\n      ctx.url = ctx.url.replace(\"\/w\/\", \"\/p\/web\/\");\n    } else {\n      ctx.originalUrl = \"\/p\/web\";\n      ctx.url = \"\/p\/web\";\n    }\n    \n    \/\/ next(false);\n    \/\/ return utils.liquidView(\"home\");\n  `\n};');
      
      // Adding routes & Controller
      const webRoutesFilepath = path.join(ctx.pluginDir, 'web', 'routes.js');
      var webRoutesFileContent = fs.readFileSync(webRoutesFilepath, 'utf8');
      webRoutesFileContent = webRoutesFileContent.split("\n");
      webRoutesFileContent.splice(webRoutesFileContent.length - 1, 0, '  {\n    method: \"get\",\n    route: \"\/web\/:pp*\",\n    action: \"websiteFrontEnd@WebVueController\",\n  },');
      fs.writeFileSync(webRoutesFilepath, webRoutesFileContent.join("\n"));
      makeFile(path.join(ctx.pluginDir, 'api', 'controllers', 'WebVueController.js'), 'module.exports = {\n\n  websiteFrontEnd: async ({req, res}) => {\n    \/\/ Domain data\n    var domainPath = req.path.replace(\"\/p\/web\", \"\");\n    if(domainPath == \"\/\") domainPath = \"\/index.html\";\n    \n    \/\/ Proxy requests\n    const webFront = Object.values(req.client.hosts).find(\n      (host) => host.type == \"website\"\n    );\n\n    const hostName = webFront.data.host;\n    const baseUrl = \"https:\/\/\" + hostName;\n    const newPath = baseUrl + \"@PS\/vue-app\" + domainPath;\n    const fallbackPath = baseUrl + \"@PS\/vue-app\/index.html\";\n    \n    try {\n      \/\/ Make request with stream response\n      const response = await utils.axios({\n        method: req.method,\n        url: newPath,\n        headers: {\n          ...req.headers,\n          host: hostName\n        },\n        responseType: \'stream\',\n        maxRedirects: 0, \/\/ Do not follow redirects\n        validateStatus: status => true \/\/ Allow any status code to be handled\n      });\n      \n      \/\/ If 404, or a redirect, try fallback path\n      if (response.status == 404 || response.status == 301 || response.status == 302) {\n        utils.log(\'Resource not found, trying fallback\', { path: newPath, fallback: fallbackPath });\n        const fallbackResponse = await utils.axios({\n          method: \'GET\',\n          url: fallbackPath,\n          headers: {\n            ...req.headers,\n            host: hostName\n          },\n          responseType: \'stream\'\n        });\n        \n        \/\/ Set headers from the fallback response\n        Object.entries(fallbackResponse.headers).forEach(([key, value]) => {\n          res.set(key, value);\n        });\n        \n        \/\/ Set the status\n        res.status(fallbackResponse.status);\n        \n        \/\/ Pipe the fallback response stream to our response\n        return fallbackResponse.data.pipe(res);\n      }\n      \n      \/\/ Set headers from the original response\n      Object.entries(response.headers).forEach(([key, value]) => {\n        res.set(key, value);\n      });\n      \n      \/\/ Set the status\n      res.status(response.status);\n      \n      \/\/ Pipe the response stream to our response\n      return response.data.pipe(res);\n    } catch (error) {\n      utils.log(\'Proxy error\', { error: error.message, path: newPath });\n      return res.status(500).json({ \n        error: \'Failed to proxy request\',\n        message: error.message \n      });\n    }\n  }\n};');
      
      console.log(" * Vue App created");
      console.log("   - Go to web/vue-app and run => npm install");
      console.log("                          then => npm run dev");
      console.log("   - Just run normal \"kha upload\" to upload your Vue App");
      
    }
  }

  // -------------------------------------------------------------------- config
  if(dirDoNotExist_or_isFixInit_or_isCustomInitCommand('config')){
    // Ask if the plugin has a config
    const hasConfig = isFixInit_or_customCommand("config", "hasConfig") || await inquirer.prompt({
      type: 'confirm',
      name: 'hasConfig',
      message: 'Does the plugin have a config?'
    });

    if (isFixInit_or_customCommand("config", "hasConfig") || hasConfig.hasConfig) {
      // Folders
      makeDir(path.join(ctx.pluginDir, 'config'));
      makeDir(path.join(ctx.pluginDir, 'config', 'database'));
      makeDir(path.join(ctx.pluginDir, 'config', 'database', 'hooks'));
      makeFile(path.join(ctx.pluginDir, 'config', 'database', 'hooks', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'config', 'database', 'models'));
      makeFile(path.join(ctx.pluginDir, 'config', 'database', 'models', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'config', 'settings'));

      // Files
      makeFile(path.join(ctx.pluginDir, 'config', 'database', 'seed.jsonc'), "[\n]");
      makeFile(path.join(ctx.pluginDir, 'config', 'settings', 'schema.jsonc'), "[\n]");
      makeFile(path.join(ctx.pluginDir, 'config', 'settings', 'data.jsonc'), "[\n]");
    }
  }

  // -------------------------------------------------------------------- tasks
  if(dirDoNotExist_or_isFixInit_or_isCustomInitCommand('tasks')){
    // Ask if the plugin has an tasks
    const hasTasks = isFixInit_or_customCommand("tasks", "hasTasks") || await inquirer.prompt({
      type: 'confirm',
      name: 'hasTasks',
      message: 'Does the plugin have tasks?'
    });

    if (isFixInit_or_customCommand("tasks", "hasTasks") || hasTasks.hasTasks) {
      // Folders
      makeDir(path.join(ctx.pluginDir, 'tasks'));
      makeDir(path.join(ctx.pluginDir, 'tasks', 'task-example'));

      // Files
      makeFile(path.join(ctx.pluginDir, 'tasks', 'task-example', 'kha-task-test-data.jsonc'), `{\n  "msg": "Hello World!" // This is a test data\n}`);
      makeFile(path.join(ctx.pluginDir, 'tasks', 'task-example', 'kha-task.example.jsonc'), `{\n  "timeout": 30000,\n  "chunks": [ // You can add as many chunks as you want (Order of chunks is important, the next chunk will exclude the paths in the previous chunks)\n    // { // Example of making a chunk for node_modules to make upload faster\n    //   "path": "./node_modules",\n    //   "name": "node_modules"\n    // },\n    {\n      "path": ".",\n      "name": "default"\n    }\n  ]\n}`);
      makeFile(path.join(ctx.pluginDir, 'tasks', 'task-example', 'run.js'), `const node_path = require('child_process').execSync('npm root -g').toString().trim();\nconst PETH = require(node_path+"/kha_plugins_engine_task_handler");\n\nconst run = async () => {\n\n  const cwd = process.cwd();\n  const taskData = await PETH.getTaskData();\n  // Example of getting data from an API, Check https://github.com/kha-cloud/plugins_engine_task_handler for documentation\n  // const testContent = await PETH.utils.$dataCaller("get", "@PA/testzz");\n\n  const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)); };\n  \n  sleep(7000);\n  \n  await PETH.setTaskResult({\n    cwd,\n    taskData,\n    // testContent,\n  });\n}\n\nrun();`);
    }
  }

  // -------------------------------------------------------------------- locales
  if(dirDoNotExist_or_isFixInit_or_isCustomInitCommand('locales')){
    // Folders
    makeDir(path.join(ctx.pluginDir, 'locales'));

    // Files
    makeFile(path.join(ctx.pluginDir, 'locales', 'ar.json'), `{\n}`);
    makeFile(path.join(ctx.pluginDir, 'locales', 'en.json'), `{\n}`);
    makeFile(path.join(ctx.pluginDir, 'locales', 'fr.json'), `{\n}`);
  }


};