### TITLE
AdminUI - Create a new menu item for the profile menu
### DESCRIPTION
Create a new menu item for the profile menu, the menu item is a simple JSON object
### REQUIREMENTS
name: string, // (REQUIRED) The name for the menu item
route: USER_INPUT
### OUTPUT_FORMAT
JSON
### OUTPUT_LOCATION
@/adminUI/menus.jsonc
### OUTPUT_OPERATION
APPEND|profileMenu
### EXAMPLE
{
  "icon": {
    "name": "mdi-home", // SHOULD be a valid Material Design Icon (MDI)
  },
  "title": "Home", // Menu item title
  "to": "/home", // Menu item route (KebabCase)
  "key": "home", // Menu item key (KebabCase)
  "roles": "root admin" // Menu item roles (space separated) Default: "root admin"
}
### END_OF_TASK