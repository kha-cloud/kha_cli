### TITLE
CONFIGS - Create a new model
### DESCRIPTION
Create a new model for the Database (Powered by MongoDB), model will be used by a custom ORM
### REQUIREMENTS
name: string, // (REQUIRED) The name for the requested model (PascalCase)
attributes: list of strings, // (REQUIRED) The attributes for the requested model
relations: list of strings, // (OPTIONAL) The relations for the requested model
### OUTPUT_FORMAT
JSON
### OUTPUT_LOCATION
@/config/database/models/{{result.model}}.jsonc
### EXAMPLE
```json
{
  "model": "Project", // name - PascalCase
  "table": "projects", // name - Plural and LowerCase
  "attributes": { // attributes
    "version": "1.0.0", // Required
    "title": "",
    "description": "",
    "hours": 0,
    "iconId": null, // relation_id (Should be `null`)
    "ownerId": null, // Required
  },
  "options": {
    "relations": { // relations (Should be `{}` if no relations)
      "iconId": {
        "type": "BELONGS_TO",
        "model": "Media",
        "byId": true, // Required
        "jsonField": "icon" // relation name for model exportation
      }
    }
  }
}
```
### END_OF_TASK