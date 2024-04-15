const adminui_assembler = require('./adminui/assemble');
const api_assembler = require('./api/assemble');
const config_assembler = require('./config/assemble');
const mobile_assembler = require('./mobile/assemble');
const web_uploader = require('./web/upload');
const static_uploader = require('./static/upload');
const locales_uploader = require('./locales/upload');
const fs = require('fs');
const path = require('path');

module.exports = async (ctx) => {
  var data = {};

  ctx.helpers.log("Assembling plugin data...");

  // Assembling adminUI data
  if (fs.existsSync(path.join(ctx.pluginDir, 'adminUI'))) {
    data.adminUi = await adminui_assembler(ctx);
  }

  // Assembling API data
  // const api_data = await api_assembler(ctx);
  if (fs.existsSync(path.join(ctx.pluginDir, 'api'))) {
    data.api = await api_assembler(ctx);
  }

  // Assembling Config data
  // const config_data = await config_assembler(ctx);
  if (fs.existsSync(path.join(ctx.pluginDir, 'config'))) {
    data.config = await config_assembler(ctx);
  }

  // Assembling Mobile data
  // const mobile_data = await mobile_assembler(ctx);
  if (fs.existsSync(path.join(ctx.pluginDir, 'mobile'))) {
    data.mobile = await mobile_assembler(ctx);
  }

  ctx.helpers.log("Plugin data assembled successfully", "success");

  // Assembling & Uploading web files
  // const web_data = await web_uploader(ctx);
  if (fs.existsSync(path.join(ctx.pluginDir, 'web'))) {
    data.web = await web_uploader(ctx);
  }

  // Uploading static files
  if (fs.existsSync(path.join(ctx.pluginDir, 'static'))) {
    await static_uploader(ctx);
  }

  // Uploading locales
  if (fs.existsSync(path.join(ctx.pluginDir, 'locales'))) {
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
      });
      if (response.error) {
        ctx.helpers.log("Error creating plugin in the server", "error");
        console.log(response.error);
        process.exit(1);
      }
      ctx.helpers.log("Plugin created successfully", "success");
      ctx.clientCache.set("plugin_exists", true);
    }
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
    process.exit(1);
  }
  ctx.helpers.log(`Plugin "${ctx.pluginKey}" uploaded successfully`, "success");
  // console.log(data);

};
