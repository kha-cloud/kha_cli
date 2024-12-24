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


};