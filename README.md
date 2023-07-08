# Kha Plugins CLI

Kha Plugins CLI is a command-line tool for managing your work with multiple websites on KhaCloud based cloud services.
Documentation for Plugins development can be found [here](https://docs.cyberocean.tn/kha-plugins/) in the near future.

## Requirements

- Node.js 12 or higher
- NPM (comes with Node.js)
- NPX
- A KhaCloud based cloud service account

## Installation

```bash
npm install -g kha_plugins_cli
```

> ** For windows users: **
> Open a command prompt as administrator and run the following command:
> ```bach
> Set-ExecutionPolicy RemoteSigned
> ```

## Update
  
```bash
npm update -g kha_plugins_cli
```

# Usage

## Configuration

Before using Kha Plugins CLI, you need to set up your `kha-plugin-config.jsonc` file

## Commands

### `khap upload`

Uploads your work to the default website

### `khap listen`

Listens for changes in your work and uploads them to the website

### `khap init`

Initializes a new Kha Plugins project

### `khap ai`

Runs an AI task, It's based on OpenAI's GPT-3 API, Some tasks require GPT-3 16K model, OpenAI key is required