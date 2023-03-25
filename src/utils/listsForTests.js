
function getListsForTests() {
    const { upperCaseFirstLetter } = require('./constantsFn');
    const fs = require('fs');
    const path = require('path');
    const { execQuery } = require('../controllers/default.controller');

        const pathArg = path.join(__dirname, '../../../../', `src/schema/types/args/`);
        const pathArgs = path.join(__dirname, '../../../../', `src/schema/types/args/`);
        const pathType = path.join(__dirname, '../../../../', `src/schema/types/`);
        const pathFixed= path.join(__dirname, '../../../../',`src/schema/types/fields/Fixed`);
        const listsForTests = [];
        
        fs.readdirSync(pathArgs).forEach(function (file) {
            if (file.match(/\.js$/) !== null && file !== 'forwardArgs.js') {
                const argName = file.replace('.js', '');
                const operationName = argName.replace('Args', 'Frag');
                const table = argName.replace('Args', 'Frag');
                const pathCondition = path.join(pathArg, `${argName}`);
                const pathArgType = path.join(pathArg, `${argName}`);
                const condition = require(pathCondition).condition;
                const typeName = `${upperCaseFirstLetter(table.replace('Frag', ''))}`
                const pathAdaptType = path.join(pathType, typeName)

                const adaptType = require(pathAdaptType);
                const key = Object.keys(adaptType).filter((key) => key.includes('Adapt'));
                const fixedFields =  require(pathFixed).fixedFields;
                const {query} =  require('../schema/utils/schemaOperation').getOperation(operationName, null);

                listsForTests.push({
                    task: execQuery,
                    sql: `SELECT TOP 1 * FROM ${adaptType[key].extensions.joinMonster.sqlTable} AS TEST`,
                    typeName: key[0],
                    table,
                    operationName,
                    condition,
                    fixedFields,
                    query,
                    pathArgType,
                });
            }
        });

        return  listsForTests;
}


module.exports.getListsForTests = getListsForTests;
