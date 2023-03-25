const path = require('path');
let fragmentsDir = path.join(__dirname,'../types/definitions/fragments');
let operationsDir = path.join(__dirname,'../../../../../src/schema/operations');


const { writeFile} = require('./schemaFsSync');

function typesBuilder(schema, type) {
  let fieldDef = ` type ${type} { `;
  Object.keys(schema.getTypeMap()[type]._fields).forEach((field) => {
    const fieldMap = schema.getTypeMap()[type]._fields[field];
    fieldDef += `
    ${field}: ${fieldMap.type.ofType ? '[' + fieldMap.type.ofType + ']' : fieldMap.type.name} `;
    fieldDef = fieldDef.replace('[ID]', 'ID').replace('cursor: [String]', 'cursor: String').replace('pageInfo: [PageInfo]', 'pageInfo: PageInfo');
  });

  fieldDef += `
  }
    `;

  return { fieldDef };
}

function fieldOperationBuilder(fragmentsDefs){
  

  let operationList = `
  type Query {
    `;

  fragmentsDefs.forEach(opeItem => {
    operationList += `${opeItem.operationAll}(${opeItem.args}): ${opeItem.typeOperation}
    `;  
  });

  operationList += `
  }
  `
  return operationList
}

async function operationBuilder(schema, NODE_ENV) {
  const { fragmentsDefs } = require(fragmentsDir);
  let types = [];
  const operations = fieldOperationBuilder(fragmentsDefs);

  fragmentsDefs.forEach(frag => {
    types.push(`${frag.type}Edge`)  
    types.push(`${frag.typeOperation}`)  
    types.push(frag.type)  
  });

  let typesDefs = `
  schema {
    query: Query
  }
  ${operations}
  type PageInfo {
    hasNextPage: Boolean
    hasPreviousPage: Boolean
    startCursor: String
    endCursor: String
  }

  scalar Date
  `;

  types.forEach((type) => {
    const { fieldDef } = typesBuilder(schema, type);
    typesDefs += `
 ${fieldDef}
    `;
  });

  if (NODE_ENV !== 'test') {
    await writeFile('./src/schema/gql/typeDefs.graphql', typesDefs);
    // const util = require('util');
    // const exec = util.promisify(require('child_process').exec);
    // await exec(`npx gqlg --schemaFilePath ./src/schema/gql/typeDefs.graphql --destDirPath ./src/schema/operations`);    
  }

  return { typesDefs }
}

function getOperation(operation, gatewayOpe) {
  const ope = require(operationsDir)
  const fieldQuery = operation.replace('Frag','')
  let query = ''
  if(ope.queries[fieldQuery]){
    query = ope.queries[fieldQuery].replace(`query ${fieldQuery}(`,`query ${fieldQuery}Frag(`)
    if(gatewayOpe){
      query = ope.queries[fieldQuery].replace(`query ${fieldQuery}(`,`query ${gatewayOpe}(`)
    }    
    return { query };
  }else{
    query = undefined;
    return { query }
  }
}

function validateOperation(operation) {
  const ope = require(operationsDir)
  const fieldQuery = operation.replace('Frag','')
  if(ope.queries[fieldQuery]){
    return true;
  }else{
    return undefined;
  }
}

module.exports = {
  typesBuilder,
  operationBuilder,
  getOperation,
  validateOperation
};
