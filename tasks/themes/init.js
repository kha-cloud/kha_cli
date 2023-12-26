const fs = require('fs');
const path = require('path');

module.exports = async (ctx, themeName) => {

  // ===========================================================================================
  //                                        THEME CREATION
  // ===========================================================================================

  const themePath = path.join(ctx.pluginDir, 'themes', themeName);

  // Check if the `themes` folder exists
  if (!fs.existsSync(path.join(ctx.pluginDir, 'themes'))) {
    fs.mkdirSync(path.join(ctx.pluginDir, 'themes'));
  }

  // Check if the theme already exists
  if (fs.existsSync(themePath)) {
    console.error('The theme already exists');
    process.exit(1);
  }

  // Create the theme folder
  fs.mkdirSync(themePath);

  // Create the theme's folders/files structure
  /*
    config:
    pages.json  settings_data.json  settings_schema.json

    layout:
    theme.liquid

    locales:
    en.json

    sections:
    footer.liquid  header.liquid

    static:
    css  images  js

    templates:
    account_page.liquid   blog_view_page.liquid  login_page.liquid
    home_page.liquid  blogs_page.liquid   register_page.liquid  contact_page.liquid
  */
  fs.mkdirSync(path.join(themePath, 'config'));
  fs.writeFileSync(path.join(themePath, 'config', 'pages.jsonc'), JSON.stringify([
    {
      "key": "contact",
      "title": "Contact",
      "template": "contact_page"
    }
  ], null, 2));
  fs.writeFileSync(path.join(themePath, 'config', 'settings_data.jsonc'), `[
	// {
	// 	"key": "setting_key",
	// 	"value": "test"
	// }\n]`);
  fs.writeFileSync(path.join(themePath, 'config', 'settings_schema.jsonc'), `[
	// {
	// 	"group": "header_template",
	// 	"key": "setting_key",
	// 	"name": "Setting key",
	// 	"description": "Setting key description",
	// 	"type": "text",
	// 	"defaultValue": "test_default"
	// }\n]`);
  fs.mkdirSync(path.join(themePath, 'layout'));
  fs.writeFileSync(path.join(themePath, 'layout', 'theme.liquid'), `<html>\n<body>
  {% section 'header.liquid' %}

  {{ content_for_layout }}

  {% section 'footer.liquid' %}\n</body>\n</html>`);
  fs.mkdirSync(path.join(themePath, 'locales'));
  fs.writeFileSync(path.join(themePath, 'locales', 'en.json'), JSON.stringify({
    "hello-world": "Hello World"
  }, null, 2));
  fs.mkdirSync(path.join(themePath, 'sections'));
  fs.writeFileSync(path.join(themePath, 'sections', 'header.liquid'), "THIS IS THE HEADER");
  fs.writeFileSync(path.join(themePath, 'sections', 'footer.liquid'), "THIS IS THE FOOTER");
  fs.mkdirSync(path.join(themePath, 'static'));
  fs.mkdirSync(path.join(themePath, 'static', 'css'));
  fs.mkdirSync(path.join(themePath, 'static', 'images'));
  fs.mkdirSync(path.join(themePath, 'static', 'js'));
  fs.mkdirSync(path.join(themePath, 'templates'));
  fs.writeFileSync(path.join(themePath, 'templates', 'account_page.liquid'), "THIS IS THE ACCOUNT PAGE PAGE");
  fs.writeFileSync(path.join(themePath, 'templates', 'blog_view_page.liquid'), "THIS IS THE BLOG VIEW PAGE PAGE");
  fs.writeFileSync(path.join(themePath, 'templates', 'login_page.liquid'), "THIS IS THE LOGIN PAGE PAGE");
  fs.writeFileSync(path.join(themePath, 'templates', 'home_page.liquid'), "THIS IS THE HOME PAGE PAGE");
  fs.writeFileSync(path.join(themePath, 'templates', 'blogs_page.liquid'), "THIS IS THE BLOGS PAGE PAGE");
  fs.writeFileSync(path.join(themePath, 'templates', 'register_page.liquid'), "THIS IS THE REGISTER PAGE PAGE");
  fs.writeFileSync(path.join(themePath, 'templates', 'contact_page.liquid'), "THIS IS THE CONTACT PAGE PAGE");

  console.log(`Theme "${themeName}" initialized successfully`);
};