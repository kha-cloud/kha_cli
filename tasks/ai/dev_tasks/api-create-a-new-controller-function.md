### TITLE
AdminUI - Create a new controller function
### DESCRIPTION
Create a new controller function, the function is a simple JSON object in JSONC format
### REQUIREMENTS
method: string, // (REQUIRED) The method for the route (GET, POST, PUT, DELETE)
description: string, // (REQUIRED) A detailed description of the api endpoint action (What does it do?)
function_name: string, // (REQUIRED) The name of the function (CamelCase)
controller_name: USER_INPUT
### OUTPUT_FORMAT
JSON For a JS file with comments
### OUTPUT_LOCATION
@/api/controllers/{{requirements.controller_name}}.js
### OUTPUT_OPERATION
INJECT|module.exports|{{RESULT}},
### EXAMPLE
exampleMethod: async ({req, res}) => {

  // Code here

  return res.json({
    test: "test"
  });
},
### END_OF_TASK