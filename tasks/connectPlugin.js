const path = require('path');
const fs = require('fs');
// const wrtc = require('wrtc');
// const { Peer } = require('peerjs');
// const { Peer } = require('peerjs-on-node');
const rootDir = process.cwd();
const wrtc = require('wrtc');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const SimplePeerJs = require('simple-peerjs');

var initFirstRun = false;
var cache = null;

const initConnection = async (ctx) => {
  const { pluginDir } = ctx;

  if(!initFirstRun) {
    cache = ctx.helpers.createCacheObject("kha_connect", pluginDir);

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
  await initConnection(ctx);
  const { pluginDir } = ctx;
  
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
    console.log('Connection established');
    // console.log(conn);
    const conn_peer_send = (objData) => {
      conn.peer.send(JSON.stringify(objData));
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
          case 'get-ai-db':
            // Handle get-ai-db request
            const aiDbData = await handleGetAiDb(pluginDir);
            conn_peer_send({ type: 'ai-db-data', data: aiDbData });
            break;

          case 'get-files-tree':
            // Handle get-files-tree request
            const filesTree = await handleGetFilesTree(pluginDir);
            conn_peer_send({ type: 'files-tree', data: filesTree });
            break;

          case 'read-file-content':
            // Handle read-file-content request
            try {
              const fileContent = await handleReadFileContent(pluginDir, data.filePath);
              conn_peer_send({ type: 'file-content', data: fileContent });
              } catch (error) {
              conn_peer_send({ type: 'file-content', data: null, error: 404, errorMessage: "File Not Found" });
            }
            break;

          case 'write-file-content':
            // Handle write-file-content request
            const writeStatus = await handleWriteFileContent(pluginDir, data.filePath, data.content);
            conn_peer_send({ type: 'file-content-is-written', data: writeStatus });
            break;

          case 'remove-file':
            // Handle remove-file request
            const removeFileStatus = await handleRemoveFile(pluginDir, data.filePath);
            conn_peer_send({ type: 'file-is-removed', data: removeFileStatus });
            break;

          case 'make-dir':
            // Handle make-dir request
            const makeDirStatus = await handleMakeDir(pluginDir, data.dirPath);
            conn_peer_send({ type: 'dir-is-made', data: makeDirStatus });
            break;

          case 'remove-dir':
            // Handle remove-dir request
            const removeDirStatus = await handleRemoveDir(pluginDir, data.dirPath);
            conn_peer_send({ type: 'dir-is-removed', data: removeDirStatus });
            break;

          case 'run-upload':
            // Handle run-upload request
            const runUploadStatus = await handleRunUpload(pluginDir);
            conn_peer_send({ type: 'run-upload-finished', data: runUploadStatus });
            break;

          default:
            console.log(`Unknown request type: ${data.type}`);
            break;
        }
      } catch (error) {
        console.error(`Error: ${error}`);
        // conn_peer_send({ type: 'error', data: error });
      }
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
