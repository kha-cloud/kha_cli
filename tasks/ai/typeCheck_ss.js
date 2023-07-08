const fs = require('fs');
const path = require('path');

function generateTaskName(ctx, fileName) {
  const groupName = fileName.split('-')[0];
  const taskName = fileName.replace(`${groupName}-`, '').replace('.md', '');
  return ctx.helpers.unSlugify(taskName) + ` (${groupName})`;
}

module.exports = async (ctx, query) => {
  // Task attributes: TITLE, DESCRIPTION, REQUIREMENTS, OUTPUT_FORMAT, OUTPUT_LOCATION, EXAMPLE

  // ---------------------------------------------- LOADING TASKS -----------------------------------------------------
  // const tasksList = fs.readFileSync(path.join(ctx.rootDir, 'tasks', 'ai', 'dev_tasks', 'list.md'), 'utf-8');
  const tasksFiles = fs.readdirSync(path.join(ctx.rootDir, 'tasks', 'ai', 'dev_tasks')).filter(file => file !== 'list.md');
  var tasksList = [
    "### Available tasks",// ( Format: {{task_code}} | {{task}} )",
    "| task_code | task description |",
    "| --------- | ---------------- |",
  ];
  var lastGeneratedTaskCode = 'AAAAA';
  const tasks = {};
  tasksFiles.map(file => {
    const task = fs.readFileSync(path.join(ctx.rootDir, 'tasks', 'ai', 'dev_tasks', file), 'utf-8');
    // taskCode goes from AAAA until ZZZZ (ENSURE that each letter goes from A to Z not more)
    const taskCode = lastGeneratedTaskCode;
    lastGeneratedTaskCode = ctx.helpers.incrementAlphabetCode(lastGeneratedTaskCode);
    tasksList.push(`| ${taskCode} | ${generateTaskName(ctx, file)} |`);
    // parsedContent: { title, description, requirements, output, format, location, example }, retrieved from task's content
    // Task's content is a markdown file with the following format:
    // ### TITLE
    // title_here ...
    // ### DESCRIPTION
    // description_here ...
    // ...
    const fieldsToParse = ['title', 'description', 'requirements', 'output_format', 'output_operation', 'output_location', 'example'];
    const parsedContent = {};
    fieldsToParse.map(field => {
      const fieldRegex = new RegExp(`### ${field.toUpperCase()}\n([\\s\\S]*?)\n###`, 'g'); // /### TITLE\n([\s\S]*?)\n###/g
      const fieldMatch = task.match(fieldRegex);
      if(fieldMatch && fieldMatch[0]){
        parsedContent[field] = fieldMatch[0].replace(`### ${field.toUpperCase()}\n`, '').replace('\n###', '').trim();
      } else {
        parsedContent[field] = '';
      }
    });
    tasks[taskCode] = {
      name: file.replace('.md', ''),
      content: parsedContent,
    };
  });
  tasksList.push(`| XXXXX | Unclear user query |`);
  tasksList.push(`| XXXXX | Missing user query |`);
  // tasksList.push(`| XXXXX | User query exists but not same operation is found |`);
  tasksList.push(`| XXXXX | User query is not a task to be done |`);
  // tasksList.push(`| XXXXX | User query is NOT VERY SPECIFIC |`);
  // tasksList.push(`| XXXXX | User query need more clarification |`);
  tasksList.push(`| XXXXX | Task Query is not related to any task in the list |`);
  tasksList = tasksList.join('\n');

  // ---------------------------------------------- CHAT GPT REQUEST -----------------------------------------------------
  const chatGPTQuery =
    `USER QUERY: ${query}\n\n${tasksList}\n\n\n`+
    `REQUEST: For the provided query, return the \`task_code\` of the corresponding task from the available list above. If there isn't an EXACT MATCH within the tasks, please return \`NO_RELEVANCE\`. Our system can ONLY execute tasks mentioned above, so accuracy in matching is ESSENTIAL,`+
    // `REQUEST: From all the available tasks above, return the \`task_code\` of the requested task for the given query, Our system can LITERALLY do ONLY the above tasks so if it's not a match return \`NO_RELEVANCE\`,`+
    `relevance_percentage is the intention relevance of the specifications and clarifications between the query and the task's description (0-100).\n`+
    // `IMPORTANT: relevance_percentage is the intention relevance of the specifications and clarifications between the query and the task's description (0-100) [100% is only for the PERFECT MATCH with zero error].\n`+
    // `relevance_percentage is the semantic comparison between the query and the task's description (0-100), and user query specifications and clarifications are very important for the relevance_percentage.\n`+
    // `REQUEST: From all the available tasks above, return the \`task_code\` of the requested task for the given query, OR return \`NO_RELEVANCE\` if requested task do not exist or differ a lot from th?e available tasks, relevance_percentage is the semantic comparison between the query and the task's description (0-100).\n`+
    `EXPECTED RESPONSE (JSON): { task_code, relevance_percentage }\n`;
  const finalResult = {
    average: 0,
    responses: [],
    task_code: null,
  };
  // Requesting multiple times to get the average (Better solution is to set the temperature to 0.2)
  for (let i = 1; i <= 1; i++) { // 1 loop is enough
    const response = await ctx.helpers.chatGPT(chatGPTQuery, { temperature: 0.2 });
    try{
      finalResult.responses.push(JSON.parse(response.replace(/XXXXX/g, 'NO_RELEVANCE')));
    } catch(e) {
      // console.log("***************************************");
      // console.log("***************************************");
      // console.log(response);
      // console.log("***************************************");
      // console.log("***************************************");
    }
  }

  // ---------------------------------------------- RESPONSE PROCESSING -----------------------------------------------------
  finalResult.average = finalResult.responses.reduce((acc, cur) => acc + cur.relevance_percentage, 0) / finalResult.responses.length;

  // Ensure that except `NO_RELEVANCE` as a `task_code` not more than two occurences should appear in finalResult.responses[].task_code
  const taskCodes = finalResult.responses.map(r => r.task_code);
  const taskCodesCount = {};
  taskCodes.forEach(taskCode => {
    if (taskCodesCount[taskCode]) {
      taskCodesCount[taskCode]++;
    } else {
      taskCodesCount[taskCode] = 1;
    }
  });
  const taskCodesCountKeys = Object.keys(taskCodesCount).filter(key => key !== 'NO_RELEVANCE').length;
  if (taskCodesCountKeys > 1) {
    return {
      task: null,
      taskType: null,
      success: false,
      error: `More than one task code found in the responses: ${JSON.stringify(taskCodesCount)} with average relevance of ${finalResult.average}`,
      shouldBeVerified: false,
    };
  }else {
    finalResult.task_code = Object.keys(taskCodesCount).filter(key => key !== 'NO_RELEVANCE')[0];
  }
  
  // console.log(chatGPTQuery);
  // console.log("--------------------------------------------------");
  // console.log("--------------------------------------------------");

  // finalResult.responses.forEach( x => console.log(x));

  // ---------------------------------------------- RETURN THE RESULT -----------------------------------------------------

  if(finalResult.average < 85){
    return {
      average: finalResult.average,
      taskType: finalResult.task_code,
      task: tasks[finalResult.task_code],
      success: false,
      error: `Average relevance of ${finalResult.average} is less than 85`,
      shouldBeVerified: false,
    };
  } else {
    return {
      average: finalResult.average,
      taskType: finalResult.task_code,
      task: tasks[finalResult.task_code],
      success: true,
      error: null,
      shouldBeVerified: (finalResult.average < 100),
    };
  }
};