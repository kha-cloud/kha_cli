const path = require('path');
const fs = require('fs');
// const wrtc = require('wrtc');
// const { Peer } = require('peerjs');
const { Peer } = require('peerjs-on-node');
const rootDir = process.cwd();

// Mock the File object to avoid ReferenceError
global.File = class {
  constructor(parts, filename, options) {
    this.parts = parts;
    this.name = filename;
    this.options = options;
  }

  // You can add methods as needed to mock behavior
};

const connectPlugin = async (ctx) => {
  const { pluginDir } = ctx;
  const peer = new Peer({
    // config: {
    //   // iceServers: [
    //   //   { urls: 'stun:stun.l.google.com:19302' },
    //   //   { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
    //   // ],
    //   wrtc,  // Use the WebRTC implementation
    // },
  });

  peer.on('open', (id) => {
    console.log(`Connected, ID: ${id}`);
    console.log(`Link: https://admin-cyberocean-x.monocommerce.tn/p/ai_dev_assistant/dev-board/${id}`);

    peer.on('connection', (conn) => {
      console.log('Connection established');
      conn.on('data', async (data) => {
        try {
          // console.log(`Received data: ${JSON.stringify(data)}`);
          switch (data.type) {
            case 'get-ai-db':
              // Handle get-ai-db request
              const aiDbData = await handleGetAiDb(pluginDir);
              conn.send({ type: 'ai-db-data', data: aiDbData });
              break;
  
            case 'get-files-tree':
              // Handle get-files-tree request
              const filesTree = await handleGetFilesTree(pluginDir);
              conn.send({ type: 'files-tree', data: filesTree });
              break;
  
            case 'read-file-content':
              // Handle read-file-content request
              const fileContent = await handleReadFileContent(pluginDir, data.filePath);
              conn.send({ type: 'file-content', data: fileContent });
              break;
  
            case 'write-file-content':
              // Handle write-file-content request
              const writeStatus = await handleWriteFileContent(pluginDir, data.filePath, data.content);
              conn.send({ type: 'file-content-is-written', data: writeStatus });
              break;
  
            case 'remove-file':
              // Handle remove-file request
              const removeFileStatus = await handleRemoveFile(pluginDir, data.filePath);
              conn.send({ type: 'file-is-removed', data: removeFileStatus });
              break;
  
            case 'make-dir':
              // Handle make-dir request
              const makeDirStatus = await handleMakeDir(pluginDir, data.dirPath);
              conn.send({ type: 'dir-is-made', data: makeDirStatus });
              break;
  
            case 'remove-dir':
              // Handle remove-dir request
              const removeDirStatus = await handleRemoveDir(pluginDir, data.dirPath);
              conn.send({ type: 'dir-is-removed', data: removeDirStatus });
              break;
  
            case 'run-upload':
              // Handle run-upload request
              const runUploadStatus = await handleRunUpload(pluginDir);
              conn.send({ type: 'run-upload-finished', data: runUploadStatus });
              break;
  
            default:
              console.log(`Unknown request type: ${data.type}`);
              break;
          }
        } catch (error) {
          console.error(`Error: ${error}`);
          // conn.send({ type: 'error', data: error });
        }
      });
    });
  });

  peer.on('error', (err) => {
    console.error(`PeerJS error: ${err}`);
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
  const ignore = ['node_modules', '.git', '.env', '.gitignore', '.cache', 'package-lock.json', 'package.json', 'yarn.lock'];

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
        results.push({ type: 'file', name: file });
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
