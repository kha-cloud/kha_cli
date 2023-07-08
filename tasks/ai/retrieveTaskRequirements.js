const inquirer = require('inquirer');

module.exports = async (ctx, query, task) => {

  // console.log("query: ", query);
  // console.log("task requirements");
  // console.log(task.content.requirements);

  // Requeste ChatGPT to generate Task requirements
  // const GPTQuery = `USER QUERY: ${query}\n\n`+
  //                   `TASK REQUIREMENTS: ${task.content.requirements}\n\n`+
  //                   `TASK DESCRIPTION: ${task.content.description}\n\n`+
  //                   // `REQUEST: READ and ANALYSE the provided user query and EXTRACT/GENERATE/GUESS a JSON object that contains the task requirements.\n`+
  //                   `REQUEST: GENERATE the values of the requirements from the user query and return a JSON object.\n`+
  //                   `IMPORTANT: If the user query didn't provide a value for an attribute, then you must GENERATE a value for it.\n`+
  //                   `IMPORTANT: If an attribute can't be generated, set it to \`USER_INPUT\`, if the attribute is not required, set it to null.\n`+
  //                   `EXPECTED RESPONSE (JSON): {\n  "field_name": "value", // could be \`USER_INPUT\` if it's impossible to guess\n  ...\n}\n`;
  
  const GPTQuery = `USER QUERY: ${query}\n\n`+
                    `TASK REQUIREMENTS: ${task.content.requirements}\n\n`+
                    `TASK DESCRIPTION: ${task.content.description}\n\n`+
                    // `REQUEST: READ and ANALYSE the provided user query and EXTRACT/GENERATE/GUESS a JSON object that contains the task requirements.\n`+
                    `REQUEST: GENERATE the values of the requirements from the user query and return a JSON object.\n`+
                    `IMPORTANT: If the user query didn't provide a value for an attribute, then you must GENERATE a value for it.\n`+
                    `IMPORTANT: If an attribute can't be generated, add it to \`userInputs\`, if the attribute is not required, set it to null.\n`+
                    // `IMPORTANT: If an attribute is \`USER_INPUT\`, add it to \`userInputs\`.\n`+
                    `EXPECTED RESPONSE (JSON): {\n  "field_name": "value", \n  ...\n  userInputs: []// Contains only the attributes that are impossible to guess OR user must input them, so user will input them on his own\n}\n`;
          
  // console.log("GPTQuery");
  // console.log(GPTQuery);
  var response;
  if ((task.content.task_type || '').trim().toUpperCase() == 'TASK_TYPE') {
    response = {
      userInputs: [],
    };
  } else {
    response = await ctx.helpers.chatGPT(GPTQuery, { temperature: 1 });
  }
  try {
    var result = JSON.parse(response);
  } catch (error) {
    return null;
  }
  const userInputs = result.userInputs || [];
  delete result.userInputs;
  for (const requirement of task.content.requirements.split('\n')) {
    const requirementName = (requirement.split(':')[0] || '').trim();
    const requirementStatus = (requirement.split(':')[1] || '').trim().toUpperCase();
    // console.log("Checking requirement: ", requirementName, " with status: ", requirementStatus);
    if ((requirementStatus == 'USER_INPUT') && !userInputs.includes(requirementName)) {
      userInputs.push(requirementName);
    }
  }

  // Use inquirer to ask user for the missing values (userInputs is an array of strings that contains the missing attributes)
  const questions = [];
  for (const input of userInputs) { // input is a string that contains the missing attribute
    questions.push({
      type: 'input',
      name: input,
      message: `Enter the value of [${input}]:`,
    });
  }
  const answers = (userInputs.length > 0) ? await inquirer.prompt(questions) : {};
  result = {...result, ...answers};
  

  return result;
};