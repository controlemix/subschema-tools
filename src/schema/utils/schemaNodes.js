const joinMonster = require('join-monster').default;
const nodeDefinitions = require('graphql-relay').nodeDefinitions;
const fromGlobalId = require('graphql-relay').fromGlobalId;
const { execQuery } = require('../../controllers/default.controller');

const options = { dialect: 'oracle' };

const { nodeInterface, nodeField } = nodeDefinitions(
  async (globalId, context, resolveInfo) => {
    const { type, id } = fromGlobalId(globalId);
    return joinMonster.getNode( type, resolveInfo, context, id, (sql) => { return execQuery(sql)},options );
  }, (obj) => obj.__type__.name
);

module.exports = { nodeInterface, nodeField };
