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
// const { Blob, File } = require('fetch-blob');
// const { File, Blob } = require('formdata-node');

// Mock the File object to avoid ReferenceError
// global.File = class {
//   constructor(parts, filename, options) {
//     this.parts = parts;
//     this.name = filename;
//     this.options = options;
//   }

//   // You can add methods as needed to mock behavior
// };
// global.File = class {
//   constructor(parts, filename, options) {
//     this.parts = parts;
//     this.name = filename;
//     this.options = options;

//     // Use a Proxy to intercept method and property access
//     return new Proxy(this, {
//       get: (target, prop, receiver) => {
//         if (prop in target) {
//           console.log(`Accessing existing property/method: ${prop}`);
//           return Reflect.get(target, prop, receiver);
//         } else {
//           console.warn(`Attempting to access non-existing property/method: ${prop}`);
//           return undefined;
//         }
//       },
//       set: (target, prop, value, receiver) => {
//         console.log(`Setting property: ${prop} to value: ${value}`);
//         return Reflect.set(target, prop, value, receiver);
//       },
//       apply: (target, thisArg, argumentsList) => {
//         console.log(`Calling method: ${target.name} with arguments: ${argumentsList}`);
//         return Reflect.apply(target, thisArg, argumentsList);
//       },
//       construct: (target, argumentsList, newTarget) => {
//         console.log(`Constructing new instance of: ${target.name} with arguments: ${argumentsList}`);
//         return Reflect.construct(target, argumentsList, newTarget);
//       },
//       has: (target, prop) => {
//         console.log(`Checking existence of property: ${prop}`);
//         return Reflect.has(target, prop);
//       },
//       deleteProperty: (target, prop) => {
//         console.log(`Deleting property: ${prop}`);
//         return Reflect.deleteProperty(target, prop);
//       },
//     });
//   }
// };

// global.File = File;
// global.Blob = Blob;
// var mocked = false;
// const { Buffer } = require('buffer');

// global.Blob = class Blob {
//   constructor(parts, options) {
//     this.parts = parts;
//     this.type = options?.type || '';
//     this.size = this.parts.reduce((size, part) => size + Buffer.byteLength(part), 0);
//   }

//   async text() {
//     return this.parts.join('');
//   }

//   async arrayBuffer() {
//     return Buffer.concat(this.parts.map(part => Buffer.from(part))).buffer;
//   }
// };

// global.File = class File extends Blob {
//   constructor(parts, name, options) {
//     super(parts, options);
//     this.name = name;
//     this.lastModified = options?.lastModified || Date.now();
//   }
// };
const connectPlugin = async (ctx) => {
  // if(!mocked) {
  //   // const { Blob, File } = await import('fetch-blob');
  //   const fetchBlobModule = await import('fetch-blob');
  
  //   const { Blob, File } = { Blob: fetchBlobModule.Blob, File: fetchBlobModule.File };
    
  //   global.File = File;
  //   global.Blob = Blob;
  //   mocked = true;
  // }
  // console.log(global.File);
  // console.log(global.Blob);
  const { pluginDir } = ctx;
  // const peer = new Peer({
  //   // config: {
  //   //   // iceServers: [
  //   //   //   { urls: 'stun:stun.l.google.com:19302' },
  //   //   //   { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
  //   //   // ],
  //   //   wrtc,  // Use the WebRTC implementation
  //   // },
  // });
  const peer = new SimplePeerJs({
    // secure: true,
    wrtc,
    fetch,
    WebSocket,
    initiator: false,
  });

  var id = await peer.id;
  // peer.on('connect', (id) => {
    console.log(`Connected, ID: ${id}`);
    console.log(`Link: https://admin-cyberocean-x.monocommerce.tn/public/ai_dev_assistant/dev-board/${id}`);

    peer.on('connect', async (conn) => {
      console.log('Connection established');
      // console.log(conn);
      const conn_peer_send = (objData) => {
        // conn.peer.send(objData);
        // console.log("Sending data:");
        // console.log(objData);
        conn.peer.send(JSON.stringify(objData));
      };
      // conn_peer_send({
      //   msg: "Hello from NodeJS Server"
      // });
      // conn.peer.on('signal', async (signalData) => {
      //   console.log("signalData +++++++++++++");
      //   console.log(signalData);
      //   console.log(JSON.parse(signalData));
      //   return true;
      // });
      // conn.peer.on('message', async (messageData) => {
      //   console.log("messageData +++++++++++++");
      //   console.log(messageData);
      //   console.log(JSON.parse(messageData));
      //   return true;
      // });
      conn.peer.on('data', async (_data) => {
        const dataString = _data.toString("utf8");
        // console.log("dataString +++++++++++++");
        // console.log(dataString);
        var data;
        try {
          data = JSON.parse(dataString);
        } catch (error) {
          console.log("dataString +++++++++++++++++++++++++++++");
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
