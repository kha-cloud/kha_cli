const fs = require('fs');
const path = require('path');

async function uploadLocales(ctx) {

  var sendLanguages = false; // A variable to track whether any languages have to be uploaded
  const languagesObject = {}; // An empty object to store the language objects
  const localesPath = path.join(ctx.pluginDir, 'locales');
  const files = fs.readdirSync(localesPath);
  const jsonFiles = files.filter(file => file.endsWith(".json"));

  var changedLocalesCount = 0;

  for (const lang of jsonFiles) { // Loop through each JSON file in the locales folder
      const fileLocation = path.join(localesPath, lang);
      const content = fs.readFileSync(fileLocation, 'utf8');
      languagesObject[lang.slice(0, -5)] = JSON.parse(content);


      const langUpdatedTime = fs.statSync(fileLocation).mtime.getTime();
      const isChanged = (langUpdatedTime != ctx.clientCache.get("LOCALES|" + lang));

      if(isChanged){
        sendLanguages = true;
        ctx.clientCache.set("LOCALES|" + lang, langUpdatedTime);
        changedLocalesCount++;
      }
  }

  if (sendLanguages) {
    const res = await ctx.helpers.dataCaller(
      "post",
      `/api/plugin_store_locales/${ctx.pluginKey}`,
      languagesObject
    );
    if (res.success) {
      ctx.helpers.log(`(${changedLocalesCount}) locales changed`, "info");
      return true;
    }else{
      return false;
    }
  }
  if(jsonFiles.length > 0){
    // ctx.helpers.log(`Locales not changed`, "info");
  }else{
    ctx.helpers.log(`No locales found`, "info");
  }
  return true;
}

module.exports = async (ctx) => {
  ctx.helpers.log("Uploading locales...");
  const localesUploaded = await uploadLocales(ctx);
  if(localesUploaded){
    ctx.helpers.log("Locales uploaded successfully", "success");
  }else{
    ctx.helpers.log("Locales failed to upload", "error");
  }
}