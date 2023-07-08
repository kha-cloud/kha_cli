const inquirer = require('inquirer');
const typeCheck_ss = require('./ai/typeCheck_ss');
const typeCheck = require('./ai/typeCheck');
const retrieveTaskRequirements = require('./ai/retrieveTaskRequirements');
const executeTask = require('./ai/executeTask');

async function queryAi(ctx, innerCallQuery = false) {
  // Task content attributes: TITLE, DESCRIPTION, REQUIREMENTS, OUTPUT, FORMAT, OUTPUT, LOCATION, EXAMPLE

  if(!innerCallQuery) {
    if(ctx.helpers.initOpenAI(ctx)){
      ctx.helpers.log("OpenAI initialized successfully", "info");
      // const res1 = await ctx.helpers.chatGPT("hello I'm khalil");
      // const res2 = await ctx.helpers.textToEmbeddings(ctx, "Hello man");
    } else {
      ctx.helpers.log("Token not valid or Initialization error", "warning");
      ctx.helpers.log("Error initializing OpenAI", "error");
      return;
    }
  }

  // if(innerCallQuery) {
  //   ctx.helpers.log("Previous query: "+innerCallQuery, "info");
  // }
  // Getting query text from user
  const oldQuery = ctx.cache.get("LAST_QUERY");
  const {query} = await inquirer.prompt({
    type: 'input',
    name: 'query',
    message: 'Enter your query:',
    default: innerCallQuery || oldQuery || null,
  });

  ctx.cache.set("LAST_QUERY", query);

  ctx.helpers.log("Query: "+query, "info");

  // Checking for Task type
  ctx.helpers.log("Checking for Task type...");
  // const parsedQuery = await typeCheck_ss(ctx, query); // Price: 0.00253 TND
  const parsedQuery = await typeCheck(ctx, query); // Price: 0.0003 TND (17 queries for 0.0051 TND)
  // if(!parsedQuery.success) {
  //   ctx.helpers.log("Percentage: "+parsedQuery.average+"%", "warning");
  //   ctx.helpers.log("Task identified as: "+ctx.helpers.unSlugify((parsedQuery.task || {name: "null"}).name), "warning");
  //   ctx.helpers.log("Error: "+parsedQuery.error, "error");
  //   ctx.helpers.log("Error in checking for Task type", "error");
  //   return;
  // } else if(parsedQuery.shouldBeVerified) {
  //   ctx.helpers.log("Task should be verified (Percentage: "+parsedQuery.average+"%)", "warning");
  //   const {validation} = await inquirer.prompt({
  //     type: 'confirm',
  //     name: 'validation',
  //     message: 'This task is identified as a '+ctx.helpers.unSlugify(parsedQuery.task.name)+' task. Do you want to validate it?',
  //     default: true,
  //   });
  //   if(!validation) {
  //     ctx.helpers.log("Task not validated", "warning");
  //     return;
  //   }
  // }
  ctx.helpers.log("Task identified as: "+ctx.helpers.unSlugify(parsedQuery.task.name), "success");
  // parsedQuery: {
  //   average: 80,
  //   taskType: 'AAAAB',
  //   task: { name: 'configs-edit-a-model', content: '...' },
  //   success: false,
  //   error: 'Average relevance of 80 is less than 90',
  //   shouldBeVerified: false
  // }

  // Retrieve Task requirements
  ctx.helpers.log("Retrieving Task requirements...");
  const taskRequirements = await retrieveTaskRequirements(ctx, query, parsedQuery.task);
  if(!taskRequirements) {
    ctx.helpers.log("Error in retrieving Task requirements", "error");
    return;
  }
  ctx.helpers.log("Task requirements retrieved successfully", "success");

  // Ask for confirmation
  const {confirmation} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmation',
    message: 'Task title: '+parsedQuery.task.name+'\nTask requirements:\n'+JSON.stringify(taskRequirements, null, 2)+'\nDo you want to execute this task?',
    default: true,
  });

  if(!confirmation) {
    ctx.helpers.log("Task is ignored", "warning");
    // Ask for another query
    const {anotherQuery} = await inquirer.prompt({
      type: 'confirm',
      name: 'anotherQuery',
      message: 'Do you want to retry another query?',
      default: true,
    });
    if(anotherQuery) {
      return await queryAi(ctx, query);
    }
    return;
  }

  // Execute Task
  ctx.helpers.log("Executing Task...");
  const taskExecution = await executeTask(ctx, query, parsedQuery.task, taskRequirements);


  console.log("taskExecution:");
  console.log(taskExecution);

};

module.exports = queryAi;