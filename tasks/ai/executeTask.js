const fs = require("fs");
const path = require("path");
const inquirer = require('inquirer');
const commentJson = require('comment-json');

module.exports = async (ctx, query, task, taskRequirements) => {
  const GPTQuery = `USER QUERY: ${query}\n\n`+
                    `TASK REQUIREMENTS:\n${JSON.stringify(taskRequirements)}\n\n`+
                    `TASK DESCRIPTION: ${task.content.description}\n\n`+
                    `TASK EXAMPLE:\n${task.content.example}\n\n\n`+
                    `REQUEST: Read the user query and use the available task requirements to do as the task description says, then return as task example shows.\n`+
                    `IMPORTANT: The TASK REQUIREMENTS should be used to generate the output.\n`+
                    `EXPECTED RESPONSE OUTPUT: ${task.content.output_format.trim()}`;
  var response;
  // Normal request Price: ~$0.008 (0.025 TND) per request
  // 16K Model request Price: ~$0.046 (0.200 TND) per request (10k tokens = ~$0.04 (0.124 TND) per request)
  if ((task.content.task_type || '').trim().toUpperCase() == 'TASK_TYPE') {
    response = "";
  } else {
    var options = {
      temperature: 1,
    };
    if(task.content.ai_model){
      const model = task.content.ai_model.split("|")[0].trim();
      const maxTokens = parseInt((task.content.ai_model.split("|")[1] || "").trim() || "2048");
      options = {
        ...options,
        model,
        max_tokens: maxTokens,
        // maxTokens: 2048,
      };
    }
    response = await ctx.helpers.chatGPT(GPTQuery, options);// max_tokens: 2048
  }
  console.log("*************************************************");
  console.log(GPTQuery);
  console.log("*************************************************");
  var result = response;
  const output_operation = task.content.output_operation.trim();
  const output_format = task.content.output_format.trim().toLowerCase();
  if(output_format === "json"){
    try {
      // result = JSON.parse(response); // Use comment-json instead of JSON.parse to allow comments in the JSON object
      result = commentJson.parse(response);
    } catch (error) {
      console.log("*************************************************");
      console.log(response);
      console.log("*************************************************");
      ctx.helpers.log("The ChatGPT's output is not a valid JSON object", "error");
      return null;
    }
  }
  var outputLocation = task.content.output_location; // @/config/models/{{result.model}}.json
  // `outputLocation` contains some missing values in the form of `{{result.variable}}` or `{{requirements.variable}}` that we need to replace with the actual values
  // `result` and `taskRequirements` are JSON objects that contain the actual values of the variables
  if(output_format === "json"){
    for (const variable in result) { 
      outputLocation = outputLocation.replace(`{{result.${variable}}}`, result[variable]);
    }
  }
  for (const variable in taskRequirements) {
    outputLocation = outputLocation.replace(`{{requirements.${variable}}}`, taskRequirements[variable]);
  }
  outputLocation = outputLocation.replace("@/", "").split("/");
  outputLocation = path.join(ctx.pluginDir, ...outputLocation);
  console.log("outputLocation: ", outputLocation);

  ctx.helpers.log("Gererated output: ", "info");
  ctx.helpers.log(JSON.stringify(result, null, 2));
  // Use inquirer to ask user if he wants to save the output to the specified location
  const { saveConfirmation } = await inquirer.prompt({
    type: 'confirm',
    name: 'saveConfirmation',
    message: `Do you want to save the output to ${outputLocation}?`,
  });
  if (saveConfirmation) {
    // Save the output to the specified location
    // ---------------------------------------- APPEND OUTPUT TO JSON FILE ----------------------------------------
    if((output_operation.split("|")[0].trim().toLowerCase() === "append") && (output_format === "json")){
      const appendTo = output_operation.split("|")[1].trim();
      // Append the output to `appendTo` attribute of the JSON file, and keep the file's comments (It's a JSONC file)
      var jsonc = commentJson.parse(fs.readFileSync(outputLocation).toString());
      const pushToJSON = (key, value) => {
        if(!!key){
          if(!jsonc[key]) jsonc[key] = [];
          jsonc[key].push(value);
        } else {
          if(!jsonc) jsonc = [];
          jsonc.push(value);
        }
      }
      // if(!jsonc[appendTo]) jsonc[appendTo] = [];
      // jsonc[appendTo].push(result);
      pushToJSON(appendTo, result);
      fs.writeFileSync(outputLocation, commentJson.stringify(jsonc, null, 2));
    }
    // ---------------------------------------- INJECT OUTPUT TO FILE ----------------------------------------
    else if(output_operation.split("|")[0].trim().toLowerCase() === "inject"){
      const injectTo = output_operation.split("|")[1].trim();
      // Inject the output to `injectTo` attribute of the file
      const injectionSchema = output_operation.split("|")[2].trim() || "{{RESULT}}";
      const injection = injectionSchema.replace("{{RESULT}}", result);
      if(!fs.existsSync(outputLocation)){
        ctx.helpers.log("Result: ", "info");
        ctx.helpers.log(injection);
        ctx.helpers.log(`Couldn't Inject the output to ${outputLocation}`, "error");
        return null;
      }
      var fileContent = fs.readFileSync(outputLocation).toString();
      // fileContent = fileContent.replace(
      //   `{{${injectTo}}}`,
      //   `{{${injectTo}}}\n${}`
      // );
      const lines = fileContent.split("\n");
      var lineIndex = -1;
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if(line.includes(injectTo)){
          lineIndex = index;
          break;
        }
      }
      if(lineIndex === -1){
        ctx.helpers.log("Result: ", "info");
        ctx.helpers.log(injection);
        ctx.helpers.log(`Couldn't Inject the output to ${outputLocation}`, "error");
        return null;
      }
      lines.splice(lineIndex+1, 0, injection);
      fs.writeFileSync(outputLocation, lines.join("\n"));
    }
    // ---------------------------------------- WRITE OUTPUT TO FILE ----------------------------------------
    else if(output_operation.split("|")[0].trim().toLowerCase() === "write_example") {
      var parsedExample = task.content.example;
      for (const variable in taskRequirements) {
        parsedExample = parsedExample.replace(`{{requirements.${variable}}}`, taskRequirements[variable]);
      }
      fs.writeFileSync(outputLocation, parsedExample);
    } else {
      fs.writeFileSync(outputLocation, response);
    }
    ctx.cache.set("LAST_QUERY", "");
  } else {
    ctx.helpers.log("Output not saved.", "warning");
    ctx.helpers.log("Gererated output: ", "info");
    ctx.helpers.log(result);
  }

  return result;
};