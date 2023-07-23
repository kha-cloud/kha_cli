### TITLE
AdminUI - Create a new api route endpoint
### DESCRIPTION
Create a new api route function (endpoint), the route is a simple JSON object in JSONC format
### REQUIREMENTS
method: string, // (REQUIRED) The method for the route (GET, POST, PUT, DELETE)
route: string, // (REQUIRED) The route for the api endpoint (SnakeCase) [Based on ExpressJS]
description: string, // (REQUIRED) A detailed description of the api endpoint action (What does it do?)
### OUTPUT_FORMAT
JSON For a JS file with comments
### OUTPUT_LOCATION
@/api/routes.js
### OUTPUT_OPERATION
INJECT|module.exports|{{RESULT}},
### EXAMPLE
  {
      method: "get",
      route: "/test_route", // `/api/` is automatically prepended
      function: /* js */`
        // Available variables: req, res

        // Code here

        return res.json({
          test: "test"
        });
      `
  }
### END_OF_TASK