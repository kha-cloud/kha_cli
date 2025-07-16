const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const AdmZip = require('adm-zip');
const inquirer = require('inquirer');


async function uploadPluginZipFile(ctx, file_path, pluginId, cyberOceanUrl, cyberOceanAccountToken) {
  let data;
  data = fs.createReadStream(file_path);
  const form = new FormData();
  form.append('file', data);
  const uploadUrl = cyberOceanUrl + `/api/plugin_api/x/upload-plugin-zip-file/${pluginId}`;
  try {
    const result = await ctx.helpers.noAuthDataCaller(
      "post",
      uploadUrl,
      form,
      {
        ...form.getHeaders(),
        "_token": cyberOceanAccountToken,
      },
    );
    if (result.success) {
      // return finalZipUrl;
      return result;
    }
    // console.log(result);
    return false;
  } catch (error) {
    console.log("uploadUrl", uploadUrl);
    console.error(error);
    return false;
  }
}

async function uploadPluginIconFile(ctx, file_path, pluginId, cyberOceanUrl, cyberOceanAccountToken) {
  let data;
  data = fs.createReadStream(file_path);
  const form = new FormData();
  form.append('file', data);
  const iconExtension = path.extname(file_path).replace('.', '');
  const uploadUrl = cyberOceanUrl + `/api/plugin_api/x/upload-plugin-icon-file/${pluginId}/${iconExtension}`;
  try {
    const result = await ctx.helpers.noAuthDataCaller(
      "post",
      uploadUrl,
      form,
      {
        ...form.getHeaders(),
        "_token": cyberOceanAccountToken,
      },
    );
    if (result.success) {
      // return finalZipUrl;
      return result;
    }
    // console.log(result);
    return false;
  } catch (error) {
    console.log("uploadUrl", uploadUrl);
    console.error(error);
    return false;
  }
}

async function getCyberOceanAccountTokenFromCache(ctx) {
  // Check if a .gitignore file exists in the root directory else create it
  if (!fs.existsSync(path.join(ctx.pluginDir, '.gitignore'))) {
    fs.writeFileSync(path.join(ctx.pluginDir, '.gitignore'), '.cyberocean_account_token\n');
  } else {
    const gitignore = fs.readFileSync(path.join(ctx.pluginDir, '.gitignore'), 'utf8');
    if (!gitignore.includes('.cyberocean_account_token')) {
      fs.appendFileSync(path.join(ctx.pluginDir, '.gitignore'), '.cyberocean_account_token\n');
    }
  }

  // Check if a .cyberocean_account_token file exists in the root directory else create it
  if (!fs.existsSync(path.join(ctx.pluginDir, '.cyberocean_account_token'))) {
    fs.writeFileSync(path.join(ctx.pluginDir, '.cyberocean_account_token'), '');
  }

  // Get CyberOcean Account Token from cache
  const cyberOceanAccountToken = fs.readFileSync(path.join(ctx.pluginDir, '.cyberocean_account_token'), 'utf8');
  return cyberOceanAccountToken;
}

async function setCyberOceanAccountTokenInCache(ctx, cyberOceanAccountToken) {
  fs.writeFileSync(path.join(ctx.pluginDir, '.cyberocean_account_token'), cyberOceanAccountToken);
}

module.exports = async (ctx) => {
  // ctx: (rootDir, command, pluginDir, pluginData, pluginKey, khaConfig, cache, clientCache, thirdPartyCache, helpers)
  // helpers: (sleep, cacheInit, getCache, setCache, createCacheObject, calculateChecksum, slugify, unSlugify, log, stringToHex, pathToLinuxFormat, incrementAlphabetCode)

  const cyberOceanUrl = "https://cyberocean.net";
  
  // Get CyberOcean Account Token
  var cyberOceanAccountToken = await getCyberOceanAccountTokenFromCache(ctx);
  if(!cyberOceanAccountToken){
    cyberOceanAccountToken = await inquirer.prompt({
      type: 'input',
      name: 'cyberOceanAccountToken',
      message: 'What is the CyberOcean Account Token?'
    });
    cyberOceanAccountToken = cyberOceanAccountToken.cyberOceanAccountToken;
    if(cyberOceanAccountToken){
      await setCyberOceanAccountTokenInCache(ctx, cyberOceanAccountToken);
    }
  }
  if(!cyberOceanAccountToken){
    ctx.helpers.log("No CyberOcean Account Token found", "error");
    process.exit(1);
  }

  // Get CyberOcean MarketPlace Plugin ID
  var cyberOceanMarketPlacePluginId = ctx.khaConfig.cyberocean_marketplace_plugin_id;
  if(!cyberOceanMarketPlacePluginId){
    ctx.helpers.log("No CyberOcean MarketPlace Plugin ID `cyberocean_marketplace_plugin_id` found in: kha-plugin-config.jsonc", "error");
    process.exit(1);
  }

  // Zip all plugin
  ctx.helpers.log("Zipping plugin data...");
  const pluginFolder = ctx.pluginDir;
  const pluginZipPath = path.join(pluginFolder, 'plugin_tmp.zip');
  if(fs.existsSync(pluginZipPath)){
    fs.unlinkSync(pluginZipPath);
  }
  const pluginZip = new AdmZip();
  pluginZip.addLocalFolder(pluginFolder);
  pluginZip.writeZip(pluginZipPath);
  ctx.helpers.log("Plugin data zipped successfully", "success");

  // Upload plugin
  ctx.helpers.log("Uploading plugin data...");
  const pluginUploadUrl = await uploadPluginZipFile(ctx, pluginZipPath, cyberOceanMarketPlacePluginId, cyberOceanUrl, cyberOceanAccountToken);
  if(!pluginUploadUrl || !pluginUploadUrl.success){
    ctx.helpers.log("Failed to upload plugin data", "error");
    process.exit(1);
  }
  ctx.helpers.log("Plugin data uploaded successfully", "success");

  // Upload plugin icon
  var iconCyberoceanUrl = "";
  if(ctx.pluginData.icon) {
    ctx.helpers.log("Uploading plugin icon...");
    const pluginIconUploadUrl = await uploadPluginIconFile(ctx, path.join(pluginFolder, 'static', ctx.pluginData.icon), cyberOceanMarketPlacePluginId, cyberOceanUrl, cyberOceanAccountToken);
    if(!pluginIconUploadUrl || !pluginIconUploadUrl.success){
      ctx.helpers.log("Failed to upload plugin icon", "error");
      process.exit(1);
    }
    iconCyberoceanUrl = pluginIconUploadUrl.cyberoceanUrl;
    ctx.helpers.log("Plugin icon uploaded successfully", "success");
  }

  // console.log("CyberOcean Account Token: " + cyberOceanAccountToken);
  // console.log("CyberOcean MarketPlace Plugin ID: " + ctx.khaConfig.cyberocean_marketplace_plugin_id);
  // console.log("Plugin Folder: " + pluginFolder);
  // console.log("Plugin Zip Path: " + pluginZipPath);
  // console.log("Plugin Upload URL: " + JSON.stringify(pluginUploadUrl));
  // process.exit(1);

  // Update plugin to CyberOcean
  ctx.helpers.log("Updating marketplace plugin...");
  const cyberOceanUpdateUrl = cyberOceanUrl + `/api/plugin_api/x/update-plugin-by-id/${cyberOceanMarketPlacePluginId}`;
  var dataToSend = {
    pluginVersion: ctx.pluginData.pluginVersion,
    name: ctx.pluginData.name,
    key: ctx.pluginData.key,
    description: ctx.pluginData.description,
    engine_version: ctx.pluginData.engine_version,
    pluginZipFileUploaded: true,
  };
  if(iconCyberoceanUrl){
    dataToSend.iconUrl = iconCyberoceanUrl;
  }
  try {
    const result = await ctx.helpers.noAuthDataCaller(
      "post",
      cyberOceanUpdateUrl,
      dataToSend,
      {
        "_token": cyberOceanAccountToken,
      }
    );
    if (result.success) {
      ctx.helpers.log("Marketplace plugin updated successfully", "success");
    } else {
      ctx.helpers.log("Failed to update marketplace plugin", "error");
      process.exit(1);
    }
  } catch (error) {
    ctx.helpers.log("Failed to update plugin", "error");
    console.error(error);
    process.exit(1);
  }
  
  // Remove plugin zip
  ctx.helpers.log("Removing tmp plugin zip...");
  fs.unlinkSync(pluginZipPath);

  // Finish message
  const finishUploadTime = new Date().toLocaleString();
  ctx.helpers.log(`Plugin "${ctx.pluginKey}" finished marketplace upload task successfully at ${finishUploadTime}`, "success");
}