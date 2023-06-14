const adminui_assembler = require('./adminui/assemble');
const api_assembler = require('./api/assemble');
const config_assembler = require('./config/assemble');
const mobile_assembler = require('./mobile/assemble');
const web_assembler = require('./web/assemble');

module.exports = async (ctx) => {
  var data = {};

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

  // Assembling Web data
  // const web_data = await web_assembler(ctx);
  if (fs.existsSync(path.join(ctx.pluginDir, 'web'))) {
    data.web = await web_assembler(ctx);
  }

  //TODO Check static and locales folders

  if(!ctx.clientCache.get("plugin_exists")){
    const response = await ctx.dataCaller("get", `/api/check_plugin_by_key/${plugin.key}`);
    if (!response.checked) {
      // Creating the plugin in the server
      const response = await ctx.dataCaller("post", "/api/plugins", {
        ...ctx.pluginData,
      });
      if (response.error) {
        console.log(response.error);
        process.exit(1);
      }
      ctx.clientCache.set("plugin_exists", true);
    }
  }

  // Sending data to the server
  const response = await axios.put(`${plugin.api}/api/plugins/${plugin.id}`, payload, {
    headers: {
      _token: plugin.token
    }
  });
  if (response.error) {
    console.log(response.error);
    process.exit(1);
  }
  console.log(`Plugin "${pluginKey}" uploaded successfully`);
  // console.log(data);

};
