const joinMonsterAdapt = require('join-monster-graphql-tools-adapter');
const schemaAdapt = (schema, schemaGQL) => {
  const path = require('path');
  const typesDir = path.join(__dirname, '../../../../../src/schema/types/');
  const types = require('../../controllers/lists.controllers').listPosTypesAdapt(typesDir);
  const schemaAdapted = { Query: { name: 'Query', fields: { ...schemaGQL.getQueryType().getFields() } }, ...types };
  joinMonsterAdapt(schema, schemaAdapted);
  return schema;
};

module.exports = { schemaAdapt };
