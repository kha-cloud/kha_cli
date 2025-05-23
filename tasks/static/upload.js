const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

function formatToRemotePath(file_path, ctx) {
  const staticFolder = ctx.helpers.pathToLinuxFormat(path.join(ctx.pluginDir, 'static'));
  return ctx.helpers.pathToLinuxFormat(file_path).replace(staticFolder, ""); // Start with `/`
}
 
async function verifyFileChecksumWithServer(file_path, ctx) {
  // ctx.helpers.log(`Verifying file [${file_path}]...`, "info");
  const local_file_checksum = await ctx.helpers.calculateChecksum(file_path);
  // ctx.helpers.log(`checksum: ${local_file_checksum}`, "info");

  try {
    const linux_file_path = ctx.helpers.stringToHex( formatToRemotePath(file_path, ctx) );

    const response = await ctx.helpers.dataCaller("get", `/api/plugin_verify_file_checksum/${ctx.pluginKey}/${linux_file_path}/${local_file_checksum}`);

    if (response.changed) {
      return true;
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  return false;
}

async function folderFetcher(folderName, ctx) {
  var list = fs.readdirSync(folderName);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // ctx.helpers.log(`Uploading files from [${folderName}]...`, "info");
  // ctx.helpers.log(`Total files: ${list.length}`, "info");
  var uploadedFiles = 0;
  var fileCounter = 0;
  const allFiles = [];
  
  // First, collect all files and process directories
  for (const file of list) {
    const fileLocation = path.join(folderName, file);
    if (fs.lstatSync(fileLocation).isDirectory()) { // ---------------- Directory --------------------
      const folderUploadedFiles = await folderFetcher(fileLocation, ctx);
      uploadedFiles += folderUploadedFiles;
    } else { // ------------------------------------------------------- File -------------------------
      // ctx.helpers.log(`Uploading file [${file}]... (1/${list.length})`, "info");
      allFiles.push(fileLocation);
    }
  }
  
  // Process files in batches of 3
  for (let i = 0; i < allFiles.length; i += 3) {
    const batch = allFiles.slice(i, i + 3);
    const batchPromises = batch.map(async (fileLocation) => {
      fileCounter++;
      // ctx.helpers.log(`Uploading file [${path.basename(fileLocation)}]... (${fileCounter}/${allFiles.length})`, "info");
      const fileUpdatedTime = fs.statSync(fileLocation).mtime.getTime();
      // Local verification
      // ctx.helpers.log(`Local verification`, "info");
      const isChanged = (fileUpdatedTime != ctx.clientCache.get("STATIC|"+formatToRemotePath(fileLocation, ctx)));
      // Server verification
      // ctx.helpers.log(`Server verification`, "info");
      const isChecksumChanged = isChanged ? await verifyFileChecksumWithServer(fileLocation, ctx) : false;
      // Upload file
      // ctx.helpers.log(`Uploading file`, "info");
      // ctx.helpers.log(`isChanged: ${isChanged}`, "info");
      // ctx.helpers.log(`isChecksumChanged: ${isChecksumChanged}`, "info");
      var isUploadedSuccessfully = false;
      if(isChecksumChanged == true){
        // ctx.helpers.log(`File [${fileLocation}] changed on server`, "info");
        ctx.helpers.log(`Uploading file [${fileLocation.replace(path.join(ctx.pluginDir, 'static'), "")}]... (${fileCounter}/${allFiles.length})`, "info");
        isUploadedSuccessfully = await uploadFile(fileLocation, ctx);
        // await sleep(1000);
        if(isUploadedSuccessfully){
          ctx.helpers.log(`File [${fileLocation.replace(path.join(ctx.pluginDir, 'static'), "")}] uploaded successfully`, "info");
          // uploadedFiles++;
          return 1; // Will be counted in uploadedFiles
        }else{
          ctx.helpers.log(`File [${fileLocation}] failed to upload`, "error");
          return 0;
        }
      }
      const sameOnServer_and_changedHere = (isChanged == true) && (isChecksumChanged == false);
      // ctx.helpers.log(`Updating cache`, "info");
      if(sameOnServer_and_changedHere || ((isChecksumChanged == true) && isUploadedSuccessfully)){ // File is changed but checksum on server is same OR checksum is changed
        ctx.clientCache.set("STATIC|"+formatToRemotePath(fileLocation, ctx), fileUpdatedTime);
      }
      if(sameOnServer_and_changedHere) {
        ctx.helpers.log(`File [${fileLocation.replace(path.join(ctx.pluginDir, 'static'), "")}] is already uploaded (Cache updated)`, "info");
      }
      return 0;
    });
    
    const results = await Promise.all(batchPromises);
    uploadedFiles += results.reduce((sum, val) => sum + val, 0);
    // await sleep(1000); // Wait a bit between batches
  }
  
  return uploadedFiles;
}

async function uploadFile(file_path, ctx) {
  const linux_file_path = ctx.helpers.stringToHex( formatToRemotePath(file_path, ctx) );
  const fileChecksum = await ctx.helpers.calculateChecksum(file_path);

  const fileExtension = path.extname(file_path);
  let data;
  
  const replaceInCode = (code) => {
    var newCode = code.replace(/@PS\//g, `/api/plugins_static/${ctx.pluginKey}/`);
    // Plugins Key
    newCode = newCode.replace(/@PK/g, `${ctx.pluginKey}`);
    // Plugins API links
    newCode = newCode.replace(/@PA\//g, `/api/plugin_api/${ctx.pluginKey}/`);
    // Plugins VueJS links
    newCode = newCode.replace(/@PV\//g, `/p/${ctx.pluginKey}/`);
    // Plugins VueJS public links
    newCode = newCode.replace(/@PVP\//g, `/public/${ctx.pluginKey}/`);
    return newCode;
  };

  if (fileExtension === '.js' || fileExtension === '.css') {
    const fileContent = fs.readFileSync(file_path, 'utf-8');
    data = replaceInCode(fileContent);
  } else {
    data = fs.createReadStream(file_path);
  }

  const form = new FormData();
  // form.append('file', fs.createReadStream(file_path));

  if (fileExtension === '.js' || fileExtension === '.css') {
    form.append('file', data, { 
      filename: path.basename(file_path), 
      contentType: fileExtension === '.js' ? 'application/javascript' : 'text/css' 
    });
  } else {
    form.append('file', data);
  }
  
  const uploadUrl = `/api/plugin_upload_file/${ctx.pluginKey}/${linux_file_path}/${fileChecksum}`;
  try {
    const result = await ctx.helpers.dataCaller(
      "post",
      uploadUrl,
      form,
      form.getHeaders(),
    );
    if (result.success) {
      return true;
    }
    console.log(result);
    return false;
  } catch (error) {
    console.log("uploadUrl", uploadUrl);
    console.error(error);
    return false;
  }
}

module.exports = async (ctx) => {
  ctx.helpers.log("Uploading static files...");
  const uploadedFiles = await folderFetcher(path.join(ctx.pluginDir, 'static'), ctx);
  ctx.helpers.log("Static files uploaded successfully (" + uploadedFiles + " files)", "success");
  // .then((_) => {
  //   return purgeCache();
  // });
}