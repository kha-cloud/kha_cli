# Introduction
- This project is to create an AI code assistant for developers to help them create their projects faster and easier, the AI will have fixed categories of tasks, and each task will have a fixed structure in terms of requirements, prompt templates, and output templates.
- The AI will have to guess the task type from the prompt, and then generate a task request with it's requirements.
- After guessing all the initial tasks, the Tasks executor will execute the tasks and alter the plugin's code.
- Some tasks will create an output and finish, and some tasks will create a new tasks requests.
- Some tasks will need some user input to be able to finish the work
- Some tasks will need some information from the the plugin's code to finish work

# Types of tasks:

1. **Informative Tasks:** These tasks are designed to extract specific information from the project or plugin code. This information can then be used to carry out other tasks or inform decision-making processes.

All Possible Tasks:

- [API] Get information about a model
- [API] Get information about an API route
- [API] Get information about a controller
- [API] Get information about a socketIO event
- [API] Get information about a redis event

- [ADMINUI] Get information about a page
- [ADMINUI] Get information about a component
- [ADMINUI] Get information about a dashboard's sidebar menu item
- [ADMINUI] Get information about a profile's menu item
- [ADMINUI] Get information about a store action
- [ADMINUI] Get information about a store mutation
- [ADMINUI] Get information about a store getter
- [ADMINUI] Get information about a store state

- [CONFIGS] Get information about a database migration
- [CONFIGS] Get information about a database seed
- [CONFIGS] Get information about a setting
- [CONFIGS] Get information about a model

- [WEB] Get information about a webpage
- [WEB] Get information about a section
- [WEB] Get information about a setting

- [Locales] Get information about a language
- [Locales] Get information about a translation

- [Static] Get information about a file
- [Static] Get information about a folder


1. **Development Tasks:** These tasks involve creating or updating parts of the codebase. These tasks are primarily action-oriented and focus on the development aspect of the project.

All Possible Tasks:

- [API] Create an API route
- [API] Edit an API route
- [API] Create a new controller
- [API] Edit a controller
- [API] Create a new socketIO event
- [API] Edit a socketIO event
- [API] Create a new redis event
- [API] Edit a redis event
- [API] Translation

- [ADMINUI] Create a new page
- [ADMINUI] Edit a page
- [ADMINUI] Create a new component
- [ADMINUI] Edit a component
- [ADMINUI] Create a new dashboard's sidebar menu item
- [ADMINUI] Edit a dashboard's sidebar menu item
- [ADMINUI] Create a new profile's menu item
- [ADMINUI] Edit a profile's menu item
- [ADMINUI] Create a store action
- [ADMINUI] Edit a store action
- [ADMINUI] Create a store mutation
- [ADMINUI] Edit a store mutation
- [ADMINUI] Create a store getter
- [ADMINUI] Edit a store getter
- [ADMINUI] Create a store state
- [ADMINUI] Edit a store state
- [ADMINUI] Translation

- [CONFIGS] Create a new model
- [CONFIGS] Edit a model
- [CONFIGS] Create a new database migration
- [CONFIGS] Edit a database migration
- [CONFIGS] Create a new database seed
- [CONFIGS] Edit a database seed
- [CONFIGS] Create a setting
- [CONFIGS] Edit a setting

- [WEB] Create a new page
- [WEB] Edit a page
- [WEB] Create a new section
- [WEB] Edit a section
- [WEB] Create a setting
- [WEB] Edit a setting
- [WEB] Translation

- [Locales] Create a new language
- [Locales] Edit a language
- [Locales] Create a new translation
- [Locales] Edit a translation

- [Static] Create a new file
- [Static] Edit a file
- [Static] Create a new folder
- [Static] Edit a folder

1. **Input Tasks:** These tasks involve asking the developer for specific inputs or information needed to complete a task. This allows the AI to obtain human insights and inputs that are necessary to ensure the code aligns with the developer's intentions.

2. **Decision Tasks:** These tasks involve making decisions based on the available information and may result in generating other tasks. These tasks can be dependent on both Informative and Input tasks, and they can generate Development tasks or even more Decision tasks as a result.