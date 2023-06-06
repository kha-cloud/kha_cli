const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');

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
    const hookFileContent = fs.readFileSync(hookFilePath, 'utf8');
    const hook = {
      model: hookFile.replace('.js', ''),
      content: hookFileContent,
    }
    dbHooks[hookFile] = hook;
  });

  return dbHooks;
};

module.exports = async (ctx) => {
  const dbSeed = getSeed(ctx);
  const dbSchema = getSchema(ctx);
  const dbHooks = getHooks(ctx);

  return {
    dbSeed,
    dbSchema,
    hooks: dbHooks,
  };
};