const clc = require('cli-color');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

function operationsJob() {
  return new Promise(async (resolve, _reject) => {
    console.log('');
    console.log(clc.greenBright('generating operations, working please await...'));
    try {
      await exec(`npx gqlg --schemaFilePath ./src/schema/gql/typeDefs.graphql --destDirPath ./src/schema/operations`);
      console.log(clc.greenBright('generating done!'));
      resolve({ success: true });
    } catch (error) {
        console.log(clc.greenBright('generating done!'));
      resolve({ success: false });
    }
  });
}

module.exports.operationsJob = operationsJob;
