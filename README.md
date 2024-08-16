# Kha CLI

Kha CLI is a command-line tool for remote AI assisted development and managing your work with multiple websites on KhaCloud based cloud services.
The tool can be used with non KhaCloud projects for remote AI assisted development.
> Documentation for Plugins development can be found [here](https://docs.cyberocean.tn/).

## Requirements

- Node.js 12 or higher
- NPM (comes with Node.js)
- NPX
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

#### `khap connect`

Connects a local project for remote work/development
> Can work on KhaCloud projects or any other type of projects

> Create a CyberOcean cloud account for enhanced AI capabilities, persistent and more secure project management

### Plugin's commands

#### `khap init`

Initializes a new Kha Plugins project

#### `khap init fix`

Fixes the project initialization by adding the missing files or folders

#### `khap upload`

Uploads your work to the default website

#### `khap listen`

Listens for changes in your work and uploads them to the website

#### `khap routes`

Shows the API and WEB routes endpoints

#### `khap ai`

Runs an AI task, It's based on OpenAI's GPT-3 API, Some tasks require GPT-3 16K model, OpenAI key is required

### Plugin's theme commands

#### `khap theme`

Shows the theme commands list, and the available themes

#### `khap theme init <THEME_NAME>`

Initializes a new theme

#### `khap theme upload <THEME_NAME>`

Uploads the all the theme files/settings to the website

#### `khap theme static-upload <THEME_NAME>`

Uploads the theme static files to the website