const fs = require('fs');
const path = require('path');
const tar = require('tar');
const FormData = require('form-data');
const commentJson = require('comment-json');

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

function getAllFiles(dir, withEditDate = false, files_) {
  files_ = files_ || {};
  var files = fs.readdirSync(dir);
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      getAllFiles(path.join(dir, file), withEditDate, files_);
    } else {
      // files_.push(path.join(dir, file));
      if (withEditDate) {
        files_[path.join(dir, file)] = fs.statSync(path.join(dir, file)).mtime.getTime();
      } else {
        files_[path.join(dir, file)] = true;
      }
    }
  });
  return files_;
}

async function uploadFile(file_path, ctx) {
  // const linux_file_path = ctx.helpers.stringToHex( formatToRemotePath(file_path, ctx) );
  //TODO IMPORTANT The randomId should be enabled to prevent loading a cached tar file from the server and for security reasons, but to get enabled, a system to remove old files should be implemented
  // const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + (new Date()).getTime().toString(36);
  const randomId = "RANDOM";
  const _tarFileRemotePath = "/__PETH_TAR_FILES__/" + ctx.pluginKey + "_" + randomId + "_" + file_path.split('/').pop();
  const tarFileRemotePath = ctx.helpers.stringToHex(_tarFileRemotePath);
  const fileChecksum = await ctx.helpers.calculateChecksum(file_path);
  // https://{XXXXXX}/api/plugins_static/{XXXXXX}/__PETH_TAR_FILES__/{XXXXXX}.tar
  const finalTarUrl = ctx.khaConfig.url + "/api/plugins_static/" + ctx.pluginKey + _tarFileRemotePath;

  const fileExtension = path.extname(file_path);
  let data;

  // if (fileExtension === '.js' || fileExtension === '.css') {
  //   const fileContent = fs.readFileSync(file_path, 'utf-8');
  //   data = replaceInCode(fileContent);
  // } else {
  //   data = fs.createReadStream(file_path);
  // }
  data = fs.createReadStream(file_path);

  const form = new FormData();

  form.append('file', data);
  
  const uploadUrl = `/api/plugin_upload_file/${ctx.pluginKey}/${tarFileRemotePath}/${fileChecksum}`;
  try {
    const result = await ctx.helpers.dataCaller(
      "post",
      uploadUrl,
      form,
      form.getHeaders(),
    );
    if (result.success) {
      return finalTarUrl;
    }
    console.log(result);
    return false;
  } catch (error) {
    console.log("uploadUrl", uploadUrl);
    console.error(error);
    return false;
  }
}

async function getTasks(ctx, isLastError) {
  const tasks = [];
  const stats = {
    updatedTasks: 0,
    updateChunks: 0,
  };

  // Get all tasks from `tasks/`
  const tasksDir = path.join(ctx.pluginDir, 'tasks');
  const tasksTarDir = path.join(ctx.pluginDir, ".cache", "tasks", "TarFiles");

  // Create `tasksTarDir` if it doesn't exist
  if (!fs.existsSync(tasksTarDir)) {
    fs.mkdirSync(tasksTarDir, { recursive: true });
  }
  
  if (fs.existsSync(tasksDir)) {
    const tasks = [];
    // fs.readdirSync(tasksDir).forEach(file => {
    for(const file of fs.readdirSync(tasksDir)) {
      // For each task:
      const taskDir = path.join(tasksDir, file);
      if (fs.lstatSync(taskDir).isFile()) {
        continue;
      }

      const taskKey = file;
      const taskObject = {
        key: taskKey,
        chunks: [],
      };

      // Load task config file "kha-task.jsonc"
      const taskConfigFile = path.join(taskDir, 'kha-task.jsonc');
      if (!fs.existsSync(taskConfigFile)) {
        continue;
      }

      const currentTaskTarDir = path.join(tasksTarDir, taskKey);

      // Create `currentTaskTarDir` if it doesn't exist
      if (!fs.existsSync(currentTaskTarDir)) {
        fs.mkdirSync(currentTaskTarDir, { recursive: true });
      }

      // Load task config
      var taskConfig = null;
      try {
        taskConfig = commentJson.parse(fs.readFileSync(taskConfigFile, 'utf8'));
      } catch (error) {
        console.error(`Error parsing ${taskConfigFile}: ${error.message}`);
        process.exit(1);
      }
      // Create task Chunks objects with all the related files
      var taskChunks = taskConfig.chunks || [ { "path": ".", "name": "default" } ];
      taskChunks = taskChunks.map((chunk, index) => {
        return {
          ...chunk,
          name: chunk.name || "unnamed-"+index,
        };
      });
      var tarArchivedPaths = [];
      // Task update status
      var taskUpdated = false;

      // For each chunk:
      for(var i = 0; i < taskChunks.length; i++) {
        const chunk = taskChunks[i];
        // For each file in the chunk:
        const chunkFiles = getAllFiles(path.join(taskDir, chunk.path), true);
        const cacheChunkFiles = ctx.cache.get(`chunkFiles-${taskKey}-${chunk.name}`) || {};

        // Check if the files are up to date
        let chunkUpdated = isLastError;
        if (!chunkUpdated) {
          for(const file in chunkFiles) {
            const lastModified = cacheChunkFiles[file];
            const currentModified = chunkFiles[file];
            if (!lastModified || lastModified !== currentModified) {
              chunkUpdated = true;
              break;
            }
          }
        }
        var pathsToTar = [chunk.path];
        if(chunk.path == ".") {
          pathsToTar = fs.readdirSync(taskDir);
          pathsToTar = pathsToTar.filter(file => !tarArchivedPaths.includes(file) && !tarArchivedPaths.includes("./"+file));
        }
        if (chunkUpdated) {
          // Pack the files into a TAR file
          const taskTarFile = path.join(currentTaskTarDir, `${taskKey}-${chunk.name}.tar`);
          if (fs.existsSync(taskTarFile)) {
            fs.unlinkSync(taskTarFile);
          }
          ctx.helpers.log(`Creating/Uploading ${taskTarFile.replace(currentTaskTarDir, "")}...`, "info");
          // console.log(` fs.readdirSync(taskDir) Files: `, fs.readdirSync(taskDir));
          // console.log(` tarArchivedPaths Files: `, tarArchivedPaths.join(", "));
          // console.log(` Files: `, pathsToTar.join(", "));
          
          // await tar.create({ gzip: false, file: taskTarFile }, pathsToTar.map(file => path.join(taskDir, file)));
          await tar.create({ gzip: false, file: taskTarFile, cwd: taskDir }, pathsToTar);
          ctx.cache.set(`chunkFiles-${taskKey}-${chunk.name}`, chunkFiles);

          // Upload it
          // ctx.helpers.log(`Uploading ${taskTarFile.replace(currentTaskTarDir, "")}...`, "info");
          const finalTarUrl = await uploadFile(taskTarFile, ctx);
          if (!finalTarUrl) {
            console.error("Error uploading the tar file");
            return;
          }

          stats.updateChunks++;
        
          // Return the chunk url
          ctx.helpers.log(`Finished ${taskTarFile.replace(currentTaskTarDir, "")}`, "info");
          // ctx.helpers.log(`URL: ${finalTarUrl}`, "info");
          taskUpdated = true;
          taskChunks[i].url = finalTarUrl;
        }
        tarArchivedPaths = tarArchivedPaths.concat(pathsToTar);
      }

      // Update task status on the server
      if (taskUpdated) {
        const taskCodeUpdateCacheKey = "plugins-engine-task-code-update-key-of-" + ctx.pluginKey + "-" + taskKey;
        const taskStatusUpdateUrl = `/api/peth/set_cache/${taskCodeUpdateCacheKey}`;
        const taskStatusUpdateResult = await ctx.helpers.dataCaller(
          "post",
          taskStatusUpdateUrl,
          { value: (new Date()).getTime(), }
        );
        // console.log("taskStatusUpdateResult ++++++++++++++");
        // console.log(taskStatusUpdateResult);
        stats.updatedTasks++;
      }
        
      // Create the task config and return it to be saved in the plugin's data
      taskObject.config = {
        ...taskConfig,
        chunks: undefined,
      };
      taskObject.chunks = taskChunks;

      tasks.push(taskObject);
    }

    return {
      tasks,
      stats,
    };
  } else {
    return {
      tasks: [],
      stats: {
        updatedTasks: 0,
        updateChunks: 0,
      }
    };
  }
}

module.exports = async (ctx) => {
  // ctx: (rootDir, command, pluginDir, pluginData, pluginKey, khaConfig, cache, clientCache, thirdPartyCache, helpers)
  // helpers: (sleep, cacheInit, getCache, setCache, createCacheObject, calculateChecksum, slugify, unSlugify, log, stringToHex, pathToLinuxFormat, incrementAlphabetCode)

  const isLastError = ctx.cache.get('pethtasks-uploading-error');
  ctx.cache.set('pethtasks-uploading-error', true); // If do not reach end of the function, it means there is an error
  const originalDirectory = process.cwd();
  const packageDirectory = path.resolve(__dirname);

  // Switch to the package directory
  process.chdir(packageDirectory);

  ctx.helpers.log("Uploading Tasks...");

  const { tasks, stats } = await getTasks(ctx, isLastError);
  // console.log("tasks +++++++++++++++++++");
  // console.log(JSON.stringify(tasks, null, 2));
  const tasksUpdateUrl = `/api/peth/update_plugin_tasks_by_key/${ctx.pluginKey}`;

  const tasksUpdateResponse = await ctx.helpers.dataCaller("post", `/api/peth/update_plugin_tasks_by_key/${ctx.pluginKey}`, {
    pluginTasks: tasks
  });
  // console.log(`++++++++++++++++++++++++++++++`);
  // console.log(`++++++++++++++++++++++++++++++`);
  // console.log(`++++++++++++++++++++++++++++++`);
  // console.log(`++++++++++++++++++++++++++++++`);
  // console.log("tasksUpdateResponse +++++++++++++++++++");
  // console.log(JSON.stringify(tasksUpdateResponse, null, 2));

  const uploadedTaskscount = tasks.filter(task => task.url).length;

  ctx.helpers.log("Tasks uploaded successfully (" + stats.updateChunks + " chunks in " + stats.updatedTasks + " tasks)", "success");

  process.chdir(originalDirectory);

  ctx.cache.set('pethtasks-uploading-error', false); // If reach end of the function, it means there is no error
  
  return {
    // tasks,
  };
};