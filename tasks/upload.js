const adminui_assembler = require('./adminui/assemble');
const api_assembler = require('./api/assemble');
const config_assembler = require('./config/assemble');
const mobile_assembler = require('./mobile/assemble');
const web_uploader = require('./web/upload');
const static_uploader = require('./static/upload');
const pethtasks_uploader = require('./pethtasks/upload');
const locales_uploader = require('./locales/upload');
const fs = require('fs');
const path = require('path');

module.exports = async (ctx) => {
  var data = {};

  ctx.helpers.log("Assembling plugin data...");
  // ctx.helpers.log("ctx.commandParams");
  // ctx.helpers.log(JSON.stringify(ctx.commandParams));

  const isPermitted = (key) => {
    const exists = fs.existsSync(path.join(ctx.pluginDir, key));
    const isIgnored = ctx.commandParams['ignore'] && ctx.commandParams['ignore'].toLowerCase().includes(key.toLowerCase());
    return exists && !isIgnored;
  };

  // Assembling adminUI data
  if (isPermitted('adminUI')) {
    data.adminUi = await adminui_assembler(ctx);
  }

  // Assembling API data
  // const api_data = await api_assembler(ctx);
  if (isPermitted('api')) {
    data.api = await api_assembler(ctx);
  }

  // Assembling Config data
  // const config_data = await config_assembler(ctx);
  if (isPermitted('config')) {
    data.config = await config_assembler(ctx);
  }

  // Assembling Mobile data
  // const mobile_data = await mobile_assembler(ctx);
  if (isPermitted('mobile')) {
    data.mobile = await mobile_assembler(ctx);
  }

  ctx.helpers.log("Plugin data assembled successfully", "success");

  // Assembling & Uploading web files
  // const web_data = await web_uploader(ctx);
  if (isPermitted('web')) {
    data.web = await web_uploader(ctx);
  }

  // Uploading static files
  if (isPermitted('static')) {
    await static_uploader(ctx);
  }

  // Uploading pethtasks files
  if (isPermitted('tasks')) {
    await pethtasks_uploader(ctx);
  }

  // Uploading locales
  if (isPermitted('locales')) {
    await locales_uploader(ctx);
  }

  // Checking if plugin exists in the server
  if(!ctx.clientCache.get("plugin_exists")){
    ctx.helpers.log("Checking if plugin exists in the server...");
    const response = await ctx.helpers.dataCaller("get", `/api/check_plugin_by_key/${ctx.pluginKey}`);
    if (!response.checked) {
      // Creating the plugin in the server
      ctx.helpers.log("Plugin does not exist in the server");
      ctx.helpers.log("Creating plugin in the server...");
      const response = await ctx.helpers.dataCaller("post", "/api/plugins", {
        ...ctx.pluginData,
        config: {
          dbSchema: [],
          dbSeed: [],
          hooks: [],
          settingsData: [],
          settingsSchema: [],
        },
      });
      if (response.error) {
        ctx.helpers.log("Error creating plugin in the server", "error");
        console.log(response.error);
        process.exit(1);
      }
      ctx.helpers.log("Plugin created successfully", "success");
    }
    ctx.clientCache.set("plugin_exists", true);
  }

  // Sending data to the server (Use /update_plugin_by_key/:key)
  ctx.helpers.log("Uploading plugin to the server...");
  var requestPayload = {
    ...data,
    ...ctx.pluginData,
  };
  if(ctx.pluginData.icon) {
    const iconUrl = ctx.pluginData.icon;
    requestPayload.iconUrl = `/api/plugins_static/${ctx.pluginKey}/`+((iconUrl[0] == "/") ? iconUrl.slice(1) : iconUrl);
  }
  const response = await ctx.helpers.dataCaller("put", `/api/update_plugin_by_key/${ctx.pluginKey}`, requestPayload);
  if (response.error) {
    ctx.helpers.log("Error uploading plugin to the server", "error");
    console.log(response.error);
    ctx.clientCache.set("plugin_exists", false);
    ctx.helpers.log("Try `kha upload` again, The local cache was updated to install the plugin next time", "info");
    process.exit(1);
  }
  const finishUploadTime = new Date().toLocaleString();
  ctx.helpers.log(`Plugin "${ctx.pluginKey}" finished upload task successfully at ${finishUploadTime}`, "success");
  // console.log(data);

};
