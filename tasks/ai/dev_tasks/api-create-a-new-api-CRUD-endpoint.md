### TITLE
AdminUI - Create a new api CRUD endpoint
### DESCRIPTION
Create a new api CRUD (endpoint), the route is a simple JSON object in JSONC format
### REQUIREMENTS
model: string, // (REQUIRED) The model for the api endpoint (PascalCase)
plural_singular: string, // (REQUIRED) The plural and singular names for the api endpoint (SnakeCase)
### OUTPUT_FORMAT
JSON For a JS file with comments
### OUTPUT_LOCATION
@/api/routes.js
### OUTPUT_OPERATION
INJECT|module.exports|{{RESULT}},
### EXAMPLE
{
  resource: [ "comment", "comments" ],
  model: "Comment",
  listingWithoutAuth: true, // The GET /api/comments route will be available without authentication
  paginatedListing: true, // The GET /api/comments route will be paginated
  filterByOwnership: true, // The GET /api/comments route will be filtered by ownership (ownerId)
},
### END_OF_TASK