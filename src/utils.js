const fs = require('fs');
const path = require('path');
const axios = require('axios');
const commentJson = require('comment-json');
const rootDir = process.cwd();

const getLPlugin = () => { // Get default website config
  const pluginsConfigPath = path.join(rootDir, 'kha-plugin-config.jsonc');
  if(!fs.existsSync(pluginsConfigPath)) {
    console.log('\x1b[31m\x1b[1m');
    console.log("The 'kha-plugin-config.jsonc' file is missing. Please create it and add your APIs.");
    console.log('\x1b[0m');
    process.exit(1);
  }
  const pluginMainConfigPath = path.join(rootDir, 'plugin.jsonc');
  if(!fs.existsSync(pluginMainConfigPath)) {
    console.log('\x1b[31m\x1b[1m');
    console.log("The 'plugin.jsonc' file is missing. Please init the project using ( khap init ) .");
    console.log('\x1b[0m');
    process.exit(1);
  }
  const pluginsContent = fs.readFileSync(pluginsConfigPath, 'utf8');
  const pluginMainConfig = fs.readFileSync(pluginMainConfigPath, 'utf8');
  const plugins = commentJson.parse(pluginsContent);

  const website = plugins.find((api) => api.default);
  if (!website) {
    throw new Error(`Default key "${plugins.default}" not found`);
  }
  return {
    ...pluginMainConfig,
    ...website,
  };
};

const getPluginInfo = async () => { // Get plug-in info from the api
  // const pluginsContent = fs.readFileSync(path.join(rootDir, '..', 'plugins.jsonc'), 'utf8');
  // const plugins = commentJson.parse(pluginsContent);

  // const plugin = plugins.find(p => p.key === pluginKey);
  // if (!plugin) {
  //   throw new Error(`Plugin with key "${pluginKey}" not found`);
  // }
  const plugin = getLPlugin();

  const requestOptions = {
    url: `${plugin.api}/api/get_plugin_by_key/${plugin.key}`,
    headers: {
      _token: plugin.token
    }
  };

  try {
    const pluginInfo = await axios.get(requestOptions.url, { headers: requestOptions.headers });
    return pluginInfo.data;
  } catch (error) {
    console.log('\x1b[31m\x1b[1m');
    console.log("One of those errors have occured:");
    console.log("   1. The plugin key is incorrect");
    console.log("   2. The API Token is incorrect");
    console.log("   3. The Internet connection is not working");
    console.log("");
    console.log('\x1b[0m');
    process.exit(1);
  }
};

module.exports = {
  getPluginInfo,
  getLPlugin,
};