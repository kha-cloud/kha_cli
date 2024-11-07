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

module.exports = async (ctx, isFixInit = false) => {

  // ===========================================================================================
  //                                        PLUGIN CREATION
  // ===========================================================================================

  // Ask for the plugin name
  const pluginName = isFixInit || await inquirer.prompt({
    type: 'input',
    name: 'pluginName',
    message: 'What is the name of the plugin?',
    default: ctx.helpers.unSlugify(path.basename(ctx.pluginDir))
  });

  // Ask for the plugin key (suggesting the plugin name in snake_case)
  const pluginKey = isFixInit || await inquirer.prompt({
    type: 'input',
    name: 'pluginKey',
    message: 'What is the key of the plugin?',
    default: snakeCase(pluginName.pluginName)
  });

  // Ask for the plugin description
  const pluginDescription = isFixInit || await inquirer.prompt({
    type: 'input',
    name: 'pluginDescription',
    message: 'What is the description of the plugin?',
    default: 'A plugin for the KhaCloud platform'
  });

  // Create the `plugin.jsonc`
  const pluginJsonc = isFixInit || {
    engine_version: "2",
    pluginVersion: '0.0.1',
    name: pluginName.pluginName,
    key: pluginKey.pluginKey,
    description: pluginDescription.pluginDescription,
    icon: "",
    permissions: {},
  };
  if(!isFixInit){
    fs.writeFileSync(path.join(ctx.pluginDir, 'plugin.jsonc'), JSON.stringify(pluginJsonc, null, 2));

    // Create the cache/dist folder
    fs.mkdirSync(path.join(ctx.pluginDir, '.cache'));
    fs.mkdirSync(path.join(ctx.pluginDir, '.cache', 'dist'));
  }

  // ===========================================================================================
  //                                        API DATA
  // ===========================================================================================

  // Ask for the App's url (Optional)
  const appUrl = isFixInit || await inquirer.prompt({
    type: 'input',
    name: 'appUrl',
    message: 'What is the url of the app (Optional)?',
    default: 'https://my-website.com'
  });

  // Ask for the App's token (Optional)
  const appToken = isFixInit || await inquirer.prompt({
    type: 'input',
    name: 'appToken',
    message: 'What is the token of the app (Optional)?',
    default: '<your-auth-token>'
  });

  // Ask for the OpenAi's token (Optional)
  const openAiToken = isFixInit || await inquirer.prompt({
    type: 'input',
    name: 'openAiToken',
    message: 'What is the token for OpenAi (Optional)?',
    default: '<OPTIONAL-your-openai-token>'
  });

  // Create the `kha-plugin-config.jsonc`
  const khaPluginConfigJsonc = isFixInit || {
    url: appUrl.appUrl,
    token: appToken.appToken,
    openai_key: openAiToken.openAiToken,
  };
  if(!isFixInit){
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

  // -------------------------------------------------------------------- adminUI
  if(!fs.existsSync(path.join(ctx.pluginDir, 'adminUI')) || isFixInit){
    // Ask if the plugin has an admin UI
    const hasAdminUi = isFixInit || await inquirer.prompt({
      type: 'confirm',
      name: 'hasAdminUi',
      message: 'Does the plugin have an admin UI?'
    });
  
    if (isFixInit || hasAdminUi.hasAdminUi) {
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
      makeFile(path.join(ctx.pluginDir, 'adminUI', 'menus.jsonc'), `{\n  "mainMenu": [\n  ],\n  "profileMenu": [\n  ],\n  "hideMainMenu": [\n  ]\n}`);
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
  if(!fs.existsSync(path.join(ctx.pluginDir, 'api')) || isFixInit){
    // Ask if the plugin has an api
    const hasApi = isFixInit || await inquirer.prompt({
      type: 'confirm',
      name: 'hasApi',
      message: 'Does the plugin have an api?'
    });

    if (isFixInit || hasApi.hasApi) {
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
  if(!fs.existsSync(path.join(ctx.pluginDir, 'web')) || isFixInit){
    // Ask if the plugin has a web
    const hasWeb = isFixInit || await inquirer.prompt({
      type: 'confirm',
      name: 'hasWeb',
      message: 'Does the plugin have a web implementation?'
    });

    if (isFixInit || hasWeb.hasWeb) {
      // Folders
      makeDir(path.join(ctx.pluginDir, 'web'));
      makeDir(path.join(ctx.pluginDir, 'web', 'templates'));
      makeFile(path.join(ctx.pluginDir, 'web', 'templates', '.gitkeep'), '');
      makeDir(path.join(ctx.pluginDir, 'web', 'sections'));
      makeFile(path.join(ctx.pluginDir, 'web', 'sections', '.gitkeep'), '');

      // Files
      makeFile(path.join(ctx.pluginDir, 'web', 'routes.js'), `module.exports = [\n];`);
    }
  }

  // -------------------------------------------------------------------- config
  if(!fs.existsSync(path.join(ctx.pluginDir, 'config')) || isFixInit){
    // Ask if the plugin has a config
    const hasConfig = isFixInit || await inquirer.prompt({
      type: 'confirm',
      name: 'hasConfig',
      message: 'Does the plugin have a config?'
    });

    if (isFixInit || hasConfig.hasConfig) {
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
  if(!fs.existsSync(path.join(ctx.pluginDir, 'tasks')) || isFixInit){
    // Ask if the plugin has an tasks
    const hasTasks = isFixInit || await inquirer.prompt({
      type: 'confirm',
      name: 'hasTasks',
      message: 'Does the plugin have tasks?'
    });

    if (isFixInit || hasTasks.hasTasks) {
      // Folders
      makeDir(path.join(ctx.pluginDir, 'tasks'));
      makeDir(path.join(ctx.pluginDir, 'tasks', 'task-example'));

      // Files
      makeFile(path.join(ctx.pluginDir, 'tasks', 'task-example', 'kha-task.jsonc'), `{\n  "timeout": 30000,\n  "chunks": [ // You can add as many chunks as you want (Order of chunks is important, the next chunk will exclude the paths in the previous chunks)\n    // { // Example of making a chunk for node_modules to make upload faster\n    //   "path": "./node_modules",\n    //   "name": "node_modules"\n    // },\n    {\n      "path": ".",\n      "name": "default"\n    }\n  ]\n}\n`);
      makeFile(path.join(ctx.pluginDir, 'tasks', 'task-example', 'run.js'), `const run = async () => {\n\n  const cwd = process.cwd();\n  const taskData = await PETH.getTaskData();\n  // Example of getting data from an API, Check https://github.com/kha-cloud/plugins_engine_task_handler for documentation\n  // const testContent = await PETH.utils.$dataCaller("get", "@PA/testzz");\n\n  const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)); };\n  \n  sleep(7000);\n  \n  await PETH.setTaskResult({\n    cwd,\n    taskData,\n    // testContent,\n  });\n}\n\nrun()\n;`);
    }
  }


};