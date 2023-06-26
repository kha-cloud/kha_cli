const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');

function replaceDollarWithHash(jsonObj) {
  if (Array.isArray(jsonObj)) {
    jsonObj.forEach(item => replaceDollarWithHash(item));
  } else if (typeof jsonObj === 'object' && jsonObj !== null) {
    for (let key in jsonObj) {
      // If key starts with '$', replace it with '#'
      if (key.startsWith('$')) {
        let newKey = '#' + key.slice(1);
        jsonObj[newKey] = jsonObj[key];
        delete jsonObj[key];
        key = newKey;  // Point key to the updated key
      }

      // If the value is an object or array, recurse
      if (typeof jsonObj[key] === 'object' && jsonObj[key] !== null) {
        replaceDollarWithHash(jsonObj[key]);
      }
    }
  }
  return jsonObj;
}

const getSeed = (ctx) => {
  const dbSeedFile = path.join(ctx.pluginDir, 'config', 'database', 'seed.jsonc');
  const dbSeedContent = fs.readFileSync(dbSeedFile, 'utf8');
  const dbSeed = commentJson.parse(dbSeedContent);
  
  return dbSeed;
};

const getSchema = (ctx) => {
  const modelsFolder = path.join(ctx.pluginDir, 'config', 'database', 'models');
  const modelFiles = fs.readdirSync(modelsFolder).filter((file) => {
    return file.endsWith('.jsonc');
  });
  const dbSchema = {};
  modelFiles.forEach((modelFile) => {
    const modelFilePath = path.join(modelsFolder, modelFile);
    const modelFileContent = fs.readFileSync(modelFilePath, 'utf8');
    if (modelFileContent.trim() === '') return;
    const model = commentJson.parse(modelFileContent);
    dbSchema[model.model] = model;
  });

  return dbSchema;
};

const getHooks = (ctx) => {
  const hooksFolder = path.join(ctx.pluginDir, 'config', 'database', 'hooks');
  const hookFiles = fs.readdirSync(hooksFolder).filter((file) => {
    return file.endsWith('.js');
  });
  const dbHooks = {};
  hookFiles.forEach((hookFile) => {
    const hookFilePath = path.join(hooksFolder, hookFile);
    const hookFileContent = eval(fs.readFileSync(hookFilePath, 'utf8'));
    const hookName = hookFile.split('.').slice(0, -1).join('.');
    const hook = replaceDollarWithHash(hookFileContent);
    dbHooks[hookName] = hook;
  });

  return dbHooks;
};

const getSettingsSchema = (ctx) => {
  const settingsSchemaFile = path.join(ctx.pluginDir, 'config', 'settings', 'schema.jsonc');
  const settingsSchemaContent = fs.readFileSync(settingsSchemaFile, 'utf8');
  const settingsSchema = commentJson.parse(settingsSchemaContent);

  return settingsSchema;
};

const getSettingsData = (ctx) => {
  const settingsDataFile = path.join(ctx.pluginDir, 'config', 'settings', 'data.jsonc');
  const settingsDataContent = fs.readFileSync(settingsDataFile, 'utf8');
  const settingsData = commentJson.parse(settingsDataContent);

  return settingsData;
};

module.exports = async (ctx) => {
  // Database data
  const dbSeed = getSeed(ctx);
  const dbSchema = getSchema(ctx);
  const dbHooks = getHooks(ctx);

  // Settings data
  const settingsSchema = getSettingsSchema(ctx);
  const settingsData = getSettingsData(ctx);

  return {
    dbSeed,
    dbSchema,
    hooks: dbHooks,
    settingsSchema,
    settingsData,
  };
};