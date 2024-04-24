const api_routes_lister = require('./api/routes_lister');
const web_routes_lister = require('./web/routes_lister');

module.exports = async (ctx) => {
  await api_routes_lister(ctx);
  await web_routes_lister(ctx);

  return;
}