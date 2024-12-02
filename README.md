# Kha CLI

Kha CLI is a command-line tool for remote AI assisted development and managing your work with multiple websites on KhaCloud based cloud services.
The tool can be used with non KhaCloud projects for remote AI assisted development.
> Documentation for Plugins development can be found [here](https://docs.cyberocean.tn/).

## Requirements

- Linux (Not tested on Windows and Mac)
- Node.js 12 or higher
- NPM (comes with Node.js)
- NPX
- node-pre-gyp ( Install using `sudo npm install -g node-pre-gyp`)
- A KhaCloud based cloud service account (For plugins only)

## Installation

```bash
sudo npm install -g kha_cli
```

> ** For windows users: **
> Open a command prompt as administrator and run the following command before installation:
> ```bach
> Set-ExecutionPolicy RemoteSigned
> ```

## Update
  
```bash
sudo npm update -g kha_cli
```

# Usage

## Configuration (For plugins only)

Before using Kha Plugins CLI, you need to set up your `kha-plugin-config.jsonc` file

## Commands

### Remote Development

#### `kha connect`

Connects a local project for remote work/development
> Can work on KhaCloud projects or any other type of projects

> Create a CyberOcean cloud account for enhanced AI capabilities, persistent and more secure project management


#### `kha connect config`

Creates the config file `kha-connect.jsonc` to add action scripts, to run remotely from the dev envirement
Example of a config file:
```jsonc
{
  "actions": [
    {
      "enabled": true, // Should be set true or the action will be ignored
      "key": "kha-upload", // Should be unique
      "label": "Kha Upload", // The name shown on the button
      "icon": "mdi-upload", // Accepts only MDI Icons
      "command": "kha upload" // Command to execute EXP: "npm run build", "./my-bash-script.sh", ...
    }
  ]
}
```

### Plugin's commands

#### `kha init`

Initializes a new Kha Plugins project

#### `kha init fix`

Fixes the project initialization by adding the missing files or folders

#### `kha upload`

Uploads your work to the default website
```bash
# Upload with ignoring some tasks (Tasks names are not case sensitive)
kha upload --ignore=tasks,adminui,...
```

#### `kha listen`

Listens for changes in your work and uploads them to the website

#### `kha routes`

Shows the API and WEB routes endpoints

#### `kha ai`

Runs an AI task, It's based on OpenAI's GPT-3 API, Some tasks require GPT-3 16K model, OpenAI key is required

### Plugin's theme commands

#### `kha theme`

Shows the theme commands list, and the available themes

#### `kha theme init <THEME_NAME>`

Initializes a new theme

#### `kha theme upload <THEME_NAME>`

Uploads the all the theme files/settings to the website

#### `kha theme static-upload <THEME_NAME>`

Uploads the theme static files to the website

### Plugin's tasks

- Init tasks in the plugin if it's not initialized yet
```bash
kha init tasks
```

- Copy the example task in the tasks folder

- Rename the file `kha-task.example.jsonc` to `kha-task.jsonc`, and fill the options

- Use the task from the API, by creating a task object
```js
// Example task to generate a video
const generateVideoTask = await utils.createTask("generate-video");

// Run the task and wait for the result, `true` is used to run the task as admin, if `false` the task will be run as the current user
const taskResult = await generateVideoTask.runAndWait(data, true);

// Run the task and don't wait for the result, and get task id, to retrieve the result later
await generateVideoTask.run(data, true);
const taskId = generateVideoTask.id; // Store the task id to use it later to retrieve the result and the state
// After some time OR from another request
const taskId = /* Retrieve the task id from where it's stored */;
const generateVideoTask = await utils.getTaskById(taskId);
const taskResult = await generateVideoTask.getResult();

// To get task state and any given point in time
const taskStatus = await myTask.getState(); // pending, finished, failed
```

For more information about tasks creation, visit the documentation of **PETH** [plugins_engine_task_handler](https://github.com/kha-cloud/plugins_engine_task_handler) on Github