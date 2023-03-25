const { GraphQLSchema } = require('graphql');
const { printSchemaWithDirectives } = require('@graphql-tools/utils');
const { gql } = require('apollo-server-express');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { resolverEntities } = require('./schemaTypes');
const { listTypesForUnion } = require('../../controllers/lists.controllers');

function builderSubGraph(NODE_ENV) {
  const { schemaAdapt } = require('./schemaAdapt');
  const { QueryRoot } = require('./schemaQuery');
  const { operationBuilder } = require('./schemaOperation');

  const schemaGQL = new GraphQLSchema({
    name: 'schema',
    description: 'Schema',
    query: QueryRoot,
  });

  const schemaWithDirectives = ` 
  ${printSchemaWithDirectives(schemaGQL)}
  
  scalar _Any 
  scalar _FieldSet 
  union _Entity = ${listTypesForUnion(require('path').join(__dirname,'../../../../../src/schema/types/'))} 

  # directive @external on FIELD_DEFINITION
  # directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
  # directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
  # directive @key(fields: _FieldSet!, resolvable: Boolean = true) repeatable on OBJECT | INTERFACE
  # directive @shareable on OBJECT | FIELD_DEFINITION
  # directive @override(from: String!) on FIELD_DEFINITION
  # directive @composeDirective(name: String!) repeatable on SCHEMA
  # directive @extends on OBJECT | INTERFACE
 
  extend type Query { 
    _entities(representations: [_Any!]!): [_Entity]! @merge 
  } 

  `;
  const {resolvers} = resolverEntities();

  const schema = buildSubgraphSchema({ typeDefs: gql` ${schemaWithDirectives} `, resolvers });
  operationBuilder(schema, NODE_ENV);
  schemaAdapt(schema, schemaGQL);
  
  return { schema };
}

module.exports = { builderSubGraph };
