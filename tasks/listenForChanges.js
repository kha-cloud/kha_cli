const chokidar = require('chokidar');
const uploadPlugin = require('./upload');

module.exports = async (ctx) => {
  // Initialize the listener for `ctx.pluginDir`
  const watcher = chokidar.watch(ctx.pluginDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true, // stay active after the first event
    ignoreInitial: true, // ignore the first event (because it's the initial scan)
    awaitWriteFinish: true, // wait for the file to be fully written
  });

  let timeout;
  const debounceTime = 500; // Adjust this time as per your need

  const debounceFunction = (func, delay) => {
    // Clear the timeout if it exists
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Set a new timeout
    timeout = setTimeout(func, delay);
  };

  const handleFileEvent = (eventType) => {
    return (path) => {
      console.log(`File ${path} has been ${eventType}`);
      debounceFunction(() => uploadPlugin(ctx), debounceTime);
    };
  };

  watcher
    .on('add', handleFileEvent('added'))
    .on('change', handleFileEvent('changed'))
    .on('unlink', handleFileEvent('removed'))
    .on('error', (error) => console.log(`Watcher error: ${error}`));
};