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
  const tasksFiles = fs.readdirSync(path.join(ctx.rootDir, 'tasks', 'ai', 'dev_tasks')).filter(file => file !== 'list.md');
  var tasksList = [
  ];
  // var lastGeneratedTaskCode = 'AAAAA';
  // const tasks = {};
  const tasks = [];
  var counter = 0;
  // tasksFiles.map(file => { // replace with for
  for(const file of tasksFiles) {
    const task = fs.readFileSync(path.join(ctx.rootDir, 'tasks', 'ai', 'dev_tasks', file), 'utf-8');
    // const taskCode = lastGeneratedTaskCode;
    // lastGeneratedTaskCode = ctx.helpers.incrementAlphabetCode(lastGeneratedTaskCode);
    // tasksList.push(`| ${taskCode} | ${generateTaskName(ctx, file)} |`);
    // tasksList.push(generateTaskName(ctx, file));

    // parsedContent: { title, description, requirements, output, format, location, example }, retrieved from task's content
    const fieldsToParse = ['title', 'description', 'requirements', 'task_type', 'ai_model', 'output_format', 'output_operation', 'output_location', 'example'];
    const parsedContent = {};
    // fieldsToParse.map(field => { // replace with for
    for(const field of fieldsToParse) {
      const fieldRegex = new RegExp(`### ${field.toUpperCase()}\n([\\s\\S]*?)\n###`, 'g'); // /### TITLE\n([\s\S]*?)\n###/g
      const fieldMatch = task.match(fieldRegex);
      if(fieldMatch && fieldMatch[0]){
        parsedContent[field] = fieldMatch[0].replace(`### ${field.toUpperCase()}\n`, '').replace('\n###', '').trim();
      } else {
        parsedContent[field] = '';
      }
    }
    // tasks[taskCode] = {
    //   name: file.replace('.md', ''),
    //   content: parsedContent,
    // };
    tasks.push({
      name: file.replace('.md', ''),
      content: parsedContent,
    });
    tasksList.push({
      name: generateTaskName(ctx, file),
      embeddings: await ctx.helpers.textToEmbeddings(ctx, parsedContent.title + ' ' + parsedContent.description),
      index: counter,
    });
    counter++;
  }

  // ---------------------------------------------- OpenAI REQUEST -----------------------------------------------------
  const queryEmbedding = await ctx.helpers.textToEmbeddings(ctx, query);
  // console.log("queryEmbedding: ");
  // console.log(queryEmbedding);

  var similarities = [];
  tasksList.map(task => {
    similarities.push({
      name: task.name,
      similarity: ctx.helpers.cosineSimilarity(queryEmbedding, task.embeddings),
      index: task.index,
    });
  });
  similarities.sort((a, b) => b.similarity - a.similarity);

  // console.log("--------------------------------------------------");
  // console.log(tasks[similarities[0].index].content.title);
  // console.log(similarities);
  // process.exit(0);
  
  return {
    task: tasks[similarities[0].index],
    success: true,
    error: null,
    shouldBeVerified: false,
  };
};