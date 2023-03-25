
module.exports = {
  builderSubGraph: require('./schemaSubgraph').builderSubGraph,
  ...require('./schemaPlugins'),
  ...require('../../utils/fixes'),
};
