const { GraphQLObjectType } = require('graphql');
const { nodeField } = require('./schemaNodes');
const QueryRoot = new GraphQLObjectType({ name: 'Query', fields: {...require('../types/index'), node: nodeField}});
module.exports = { QueryRoot };