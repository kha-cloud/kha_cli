const path = require('path');
const fs = require('fs');
const rootDir = process.cwd();
const wrtc = require('wrtc');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const SimplePeerJs = require('simple-peerjs');
const commentJson = require('comment-json');
const { exec } = require('child_process');

var initFirstRun = false;
var cache = null;
var projectConfig = {
  actions: [],
};
const KhaCliVersion = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')).version;

var commandsRunCache = {};

const runCommand = async (command, location) => {
  const cacheKey = `${location}:${command}`;

  // Check if command is already running for the given location
  if (commandsRunCache[cacheKey]) {
    return {
      type: "ignored",
      reason: "already-running",
    };
  }

  // Flag this command as running
  commandsRunCache[cacheKey] = true;

  try {
    const startTime = Date.now();
    
    await new Promise((resolve, reject) => {
      exec(command, { cwd: location }, (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
        resolve();
      });
    });

    const endTime = Date.now();

    // Command finished successfully
    return {
      type: "finished",
      time: endTime - startTime,
    };
  } catch (error) {
    // Handle errors (e.g., timeout)
    return {
      type: "error",
      reason: error.message.includes("timeout") ? "timeout" : "crash",
    };
  } finally {
    // Cleanup and allow the command to run again in the future
    delete commandsRunCache[cacheKey];
  }
  
  // Return state DOC
  // return {
  //   type: "finished", // Could be: finished, error, ignored
  //   reason: "timeout" (In case of error) // Could be: timeout, crash, already-running
  //   time: 500, // Time used to run the command
  // };
};
// Init connection & First Run
const initConnectionAndFirstRun = async (ctx) => {
  const { pluginDir } = ctx;

  if(!initFirstRun) {
    // Project config
    const projectConfigPath = path.join(pluginDir, 'kha-connect.jsonc');
    if(fs.existsSync(projectConfigPath)) {
      projectConfig = commentJson.parse(fs.readFileSync(projectConfigPath, 'utf8'));
    }
    projectConfig.version = KhaCliVersion;
    projectConfig.name = projectConfig.name || pluginDir.replace(/\\/g, '/').replace(/\/$/, '').split('/').reverse()[0];
    
    // Cache init
    cache = ctx.helpers.createCacheObject("kha_connect", pluginDir);

    // Remote project init
    if(!cache.get("localProject")) {
      ctx.helpers.log("Creating a remote project ...", "info");
      const res = await ctx.helpers.noAuthDataCaller(
        "get",
        "https://admin-cyberocean-x.monocommerce.tn/api/plugin_api/ai_dev_assistant/generate_local_project"
      );
      cache.set("localProject", res);
    }
    
    initFirstRun = true;
  }
};

const updateProjectPeerId = async (ctx, peerId) => {
  const { pluginDir } = ctx;

  var localProject = cache.get("localProject");
  const res = await ctx.helpers.noAuthDataCaller(
    "post",
    "https://admin-cyberocean-x.monocommerce.tn/api/plugin_api/ai_dev_assistant/update_local_project_peer_id/",
    {
      id: localProject.id,
      secretKey: localProject.secretKey,
      peerId: peerId,
    }
  );
};

const connectPlugin = async (ctx) => {
  await initConnectionAndFirstRun(ctx);
  const { pluginDir } = ctx;

  var allConnectedPeers = {};
  
  const peer = new SimplePeerJs({
    // secure: true,
    wrtc,
    fetch,
    WebSocket,
    initiator: false,
  });

  var id = await peer.id;
  // peer.on('connect', (id) => {
  await updateProjectPeerId(ctx, id);
  console.log(`Connected, Peer ID: ${id}`);
  console.log(`Local project ID: ${cache.get("localProject").id}`);
  console.log(`Link: https://admin-cyberocean-x.monocommerce.tn/public/ai_dev_assistant/dev-board/${cache.get("localProject").id}`);

  peer.on('connect', async (conn) => {
    console.log('Connection established from: ' + conn.peerId);
    allConnectedPeers[conn.peerId] = conn;
    // console.log(conn);
    const conn_peer_send = (objData) => {
      conn.peer.send(JSON.stringify(objData));
    };
    const all_peers_send = (objData) => {
      for (let i = 0; i < Object.keys(allConnectedPeers).length; i++) {
        const p_conn_key = Object.keys(allConnectedPeers)[i];
        const p_conn = allConnectedPeers[p_conn_key];
        p_conn.peer.send(JSON.stringify(objData));
      }
    };
    conn.peer.on('data', async (_data) => {
      const dataString = _data.toString("utf8");
      var data;
      try {
        data = JSON.parse(dataString);
      } catch (error) {
        console.log("++++++++++++++++++ dataString ++++++++++++++++++");
        console.log(dataString);
        console.error("Error parsing coming data");
        return;
      }
      try {
        // console.log(`Received data: ${JSON.stringify(data)}`);
        switch (data.type) {
          case 'project-config':
            // Handle project-config request
            conn_peer_send({ type: data.type+"-response", data: projectConfig });
            break;

          case 'get-ai-db':
            // Handle get-ai-db request
            const aiDbData = await handleGetAiDb(pluginDir);
            conn_peer_send({ type: data.type+"-response", data: aiDbData });
            break;

          case 'get-files-tree':
            // Handle get-files-tree request
            const filesTree = await handleGetFilesTree(pluginDir);
            conn_peer_send({ type: data.type+"-response", data: filesTree });
            break;

          case 'read-file-content':
            // Handle read-file-content request
            try {
              const fileContent = await handleReadFileContent(pluginDir, data.filePath);
              conn_peer_send({ type: data.type+"-response", data: fileContent });
              } catch (error) {
              conn_peer_send({ type: data.type+"-response", data: null, error: 404, errorMessage: "File Not Found" });
            }
            break;

          case 'write-file-content':
            // Handle write-file-content request
            const writeStatus = await handleWriteFileContent(pluginDir, data.filePath, data.content);
            conn_peer_send({ type: data.type+"-response", data: writeStatus });
            break;

          case 'remove-file':
            // Handle remove-file request
            const removeFileStatus = await handleRemoveFile(pluginDir, data.filePath);
            conn_peer_send({ type: data.type+"-response", data: removeFileStatus });
            break;

          case 'make-dir':
            // Handle make-dir request
            const makeDirStatus = await handleMakeDir(pluginDir, data.dirPath);
            conn_peer_send({ type: data.type+"-response", data: makeDirStatus });
            break;

          case 'remove-dir':
            // Handle remove-dir request
            const removeDirStatus = await handleRemoveDir(pluginDir, data.dirPath);
            conn_peer_send({ type: data.type+"-response", data: removeDirStatus });
            break;

          case 'run-upload':
            // Handle run-upload request
            const runUploadStatus = await handleRunUpload(pluginDir);
            conn_peer_send({ type: data.type+"-response", data: runUploadStatus });
            break;

          default:
            const selectedAction = projectConfig.actions.find(ac => ac.key == data.type);
            if(selectedAction) {
              all_peers_send({
                type: "action-status-event",
                data: "Running action [ " + selectedAction.label + " ] ...",
              });
              runCommand(selectedAction.command, pluginDir).then((state) => {
                conn_peer_send({ type: data.type+"-response", data: {
                  action: selectedAction,
                  state: state,
                } });
                all_peers_send({
                  type: "action-status-event",
                  data: "",
                });
              });
            } else {
              console.log(`Unknown request type: ${data.type}`);
            }
            break;
        }
      } catch (error) {
        console.error(`Error: ${error}`);
        // conn_peer_send({ type: 'error', data: error });
      }
    });
    conn.peer.on('close', async () => {
      delete allConnectedPeers[conn.peerId];
    });
    conn.peer.on('error', async () => {
      delete allConnectedPeers[conn.peerId];
    });
  });
  // });

  peer.on('error', (err) => {
    console.error(`PeerJS error: ${err}`);
    peer.close();
    setTimeout(() => {
      connectPlugin(ctx);
    }, 100);
  });
};

// Helper functions to handle each type of request
const handleGetAiDb = async (pluginDir) => {
  const filePath = path.join(pluginDir, 'ai-db.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
  }
  const aiDbData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return aiDbData;
};

const handleGetFilesTree = async (pluginDir) => {
  const ignore = ['node_modules', '.git', '.env', '.gitignore', '.gitkeep', '.cache', 'package-lock.json', 'package.json', 'yarn.lock'];

  const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      if (ignore.includes(file)) return;
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results.push({ type: 'directory', name: file, children: walk(filePath) });
      } else {
        results.push({ type: 'file', name: file, path: filePath.replace(rootDir, ""), });
      }
    });
    return results;
  };

  return walk(pluginDir);
};

const handleReadFileContent = async (pluginDir, filePath) => {
  const absolutePath = path.join(pluginDir, filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error('File does not exist');
  }
  const fileContent = fs.readFileSync(absolutePath, 'utf8');
  return fileContent;
};

const handleWriteFileContent = async (pluginDir, filePath, content) => {
  // console.log("filePath ================================================");
  // console.log(filePath);
  // console.log("content ================================================");
  // console.log(content);
  const absolutePath = path.join(pluginDir, filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error('File does not exist');
  }
  fs.writeFileSync(absolutePath, content);
  return { success: true };
};

const handleRemoveFile = async (pluginDir, filePath) => {
  const absolutePath = path.join(pluginDir, filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error('File does not exist');
  }
  fs.unlinkSync(absolutePath);
  return { success: true };
};

const handleMakeDir = async (pluginDir, dirPath) => {
  const absolutePath = path.join(pluginDir, dirPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return { success: true };
};

const handleRemoveDir = async (pluginDir, dirPath) => {
  const absolutePath = path.join(pluginDir, dirPath);
  if (fs.existsSync(absolutePath)) {
    fs.rmdirSync(absolutePath, { recursive: true });
  }
  return { success: true };
};

const handleRunUpload = async (pluginDir) => {
  const exec = require('child_process').exec;
  
  return new Promise((resolve, reject) => {
    exec('khap upload', { cwd: pluginDir }, (error, stdout, stderr) => {
      if (error) {
        reject({ success: false, error: stderr });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
};

module.exports = connectPlugin;
