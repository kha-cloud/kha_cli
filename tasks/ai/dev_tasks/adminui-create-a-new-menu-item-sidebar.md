### TITLE
AdminUI - Create a new menu item (Sidebar)
### DESCRIPTION
Create a new menu item for the sidebar, the menu item is a simple JSON object
### REQUIREMENTS
name: string, // (REQUIRED) The name for the menu item
route: USER_INPUT
### OUTPUT_FORMAT
JSON
### OUTPUT_LOCATION
@/adminUI/menus.jsonc
### OUTPUT_OPERATION
APPEND|mainMenu
### EXAMPLE
{
  "icon": {
    "name": "mdi-home", // SHOULD be a valid Material Design Icon (MDI)
  },
  "title": "Home", // Menu item title
  "to": "/home", // Menu item route (KebabCase)
  "key": "home", // Menu item key (KebabCase)
  "position": "after dashboard", // Menu item position {(before/after) (menu item key)}
  "roles": "root admin" // Menu item roles (space separated) Default: "root admin"
}
### END_OF_TASK