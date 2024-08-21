const path = require('path');
const fs = require('fs');
const rootDir = process.cwd();

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

const connectCreateConfig = async (ctx) => {
  const { pluginDir } = ctx;

  makeFile(path.join(pluginDir, 'kha-connect.jsonc'), JSON.stringify({
    actions: [
      {
        "enabled": false,
        "key": "kha-upload",
        "label": "Kha Upload",
        "icon": "mdi-upload",
        "command": "kha upload"
      }
    ],
  }, null, 2));

};

module.exports = connectCreateConfig;
