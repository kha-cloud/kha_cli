const fs = require('fs');
const path = require('path');
const tar = require('tar');
const commentJson = require('comment-json');
const pethtasks_uploader = require('./pethtasks/upload');

const extractTarFile = async (tarFilePath, extractFolderPath) => {
  try {
    return tar.extract({
      file: tarFilePath,
      cwd: extractFolderPath
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports = async (ctx) => {
  const PETH = require("kha_plugins_engine_task_handler/master");
  // INITIALIZATION
  // const rootDir = __dirname;
  const command = process.argv[3];
  // const commandArgs = process.argv.slice(3);
  const pluginDir = process.cwd();

  ctx.helpers.log("Assembling plugin data...");

  // Show Tasks Help
  if (!command) {
    console.log('Available commands:');
    console.log('    task <TASK_KEY> <- Run the task');
    console.log();
    process.exit(0);
  }

  const taskKey = command;
  const tasksDir = path.join(ctx.pluginDir, 'tasks');
  const currentTaskDir = path.join(tasksDir, taskKey);
  const currentTaskCacheDir = path.join(ctx.pluginDir, ".cache", "tasks", "TarFiles", taskKey);
  const tasksCacheRunDir = path.join(ctx.pluginDir, ".cache", "tasks", "runs");
  const currentTaskCacheRunDir = path.join(tasksCacheRunDir, taskKey);
  
  if (!fs.existsSync(tasksDir)) {
    ctx.helpers.log(`Plugin "${ctx.pluginKey}" does not contain tasks`, "error");
    process.exit(1);
  }
  
  if(!fs.existsSync(currentTaskDir)) {
    ctx.helpers.log(`Plugin "${ctx.pluginKey}" does not contain task folder "${taskKey}"`, "error");
    process.exit(1);
  }
  
  if(!fs.existsSync(path.join(currentTaskDir, 'kha-task.jsonc'))) {
    ctx.helpers.log(`Plugin "${ctx.pluginKey}" does not contain config file "kha-task.jsonc" for task "${taskKey}"`, "error");
    process.exit(1);
  }
  
  if(!fs.existsSync(path.join(currentTaskDir, 'run.js'))) {
    ctx.helpers.log(`Plugin "${ctx.pluginKey}" does not contain JS entry file "run.js" for task "${taskKey}"`, "error");
    process.exit(1);
  }

  // Uploading pethtasks files
  const { tasks } = await pethtasks_uploader(ctx, true);

  const currentTaskData = tasks.find(task => task.key === taskKey);
  const currentTaskTarFiles = currentTaskData.chunks.map(chunk => {
    return path.join(currentTaskCacheDir, `${taskKey}-${chunk.name}.tar`);
  });

  // Cache folders check and cleanup
  if (!fs.existsSync(tasksCacheRunDir)) {
    fs.mkdirSync(tasksCacheRunDir, { recursive: true });
  }
  if (fs.existsSync(currentTaskCacheRunDir)) {
    fs.rmSync(currentTaskCacheRunDir, { recursive: true, force: true });
  }
  fs.mkdirSync(currentTaskCacheRunDir, { recursive: true });

  const extractStartTime = Date.now();
  // Extract the Task code Tar files to the cache folder
  for(let i = 0; i < currentTaskTarFiles.length; i++) {
    const tarFile = currentTaskTarFiles[i];
    await extractTarFile(tarFile, currentTaskCacheRunDir);
  }
  const extractFinishTime = Date.now();

  // console.log("currentTaskTarFiles +++++");
  // console.log(JSON.stringify(currentTaskTarFiles, null, 2));

  // Run Task
  const taskTestData = commentJson.parse(fs.readFileSync(path.join(currentTaskDir, 'kha-task-test-data.jsonc'), 'utf8'));
  const randomKey = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
  var data = {
    // -------- IMPORTANT DUPLICATED in module_plugins-engine for production mode -------- //
    runAndWait: true,
    taskKey,
    runId: taskKey + "-" + randomKey,
    taskCodeUpdateCacheKey: null,
    data: taskTestData,
    asAdmin: true,
    apiData: {
      host: ctx.khaConfig.url.replace("https://", "").replace("http://", ""),
      token: ctx.khaConfig.token,
      pluginKey: ctx.pluginKey,
    },
    config: currentTaskData.config,
  };
  const startTime = Date.now();
  ctx.helpers.log(`Running task "${taskKey}"...`);
  ctx.helpers.log(`Extracted ${currentTaskTarFiles.length} tar files in ${((extractFinishTime - extractStartTime) / 1000)}s`, "info");
  ctx.helpers.log("Current Task run Folder: " + currentTaskCacheRunDir, "info");

  var childError = null;
  const result = await PETH.runTask(data, false, {
    taskTmpWorkDir: currentTaskCacheRunDir,
    taskDir: currentTaskDir,
  }).then(result => {
    if(result["__ERROR__"] || result["__TIMEOUT__"]) {
      childError = result["__TIMEOUT__"] || result["__ERROR_DATA__"]?.stderr;
      return result;
    }
    ctx.helpers.log(`Task "${taskKey}" finished successfully in ` + ((Date.now() - startTime) / 1000) + " seconds", "success");
  }).catch(err => {
    childError = err;
  });

  if (childError) {
    console.log('');
    console.log('');
    console.error('Error in child process:', childError);
    ctx.helpers.log(`Task "${taskKey}" finished with error in ` + ((Date.now() - startTime) / 1000) + " seconds", "error");
    process.exit(1);
  }
  //  else {
  //   console.log('testooo');
  //   console.log(result);
  // }

};
