const path = require('path');

const baseModPath = path.join(__dirname, '..', '..');
const baseAppPath = path.join(__dirname, '..', '..', '..', '..');

const baseModPaths = {
  src: path.join(baseModPath, 'src'),
  helpers: path.join(baseModPath, 'src', 'helpers'),
  utils: path.join(baseModPath, 'src', '/schema/','utils'),
};

const baseAppPaths = {
  src: path.join(baseAppPath, 'src'),
  resolvers: path.join(baseAppPath, 'src', '/schema/', 'resolvers'),
  typeDefs: path.join(baseAppPath, 'src', '/schema/', 'typeDefs/'),
  schema: path.join(baseAppPath, 'src', '/schema'),
  gql: path.join(baseAppPath, 'src',  '/schema/', 'gql'),
  logs: path.join(baseAppPath, '/', 'logs'),
  public: path.join(baseAppPath, '/','public'),
  supergraph: path.join(baseAppPath, 'src', '/schema', '/gql', '/supergraph'),
  subgraphs: path.join(baseAppPath, 'src', '/schema', '/gql', '/subgraphs'),
};

const paths = {
  baseModPaths,
  baseModPath,
  baseAppPaths,
  baseAppPath,
};

module.exports = { paths };
