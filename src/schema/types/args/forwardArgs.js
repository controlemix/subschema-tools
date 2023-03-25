const forwardArgs = {
  id: {
    description: 'ID of the object',
    type: require('graphql').GraphQLID,
  },
  first: {
    description: 'The number of objects to return',
    type: require('graphql').GraphQLInt,
  },
  after: {
    description: 'The cursor to continue',
    type: require('graphql').GraphQLString,
  },
};

const argsForwardType = {
  loadDate: {
    description: 'Load date to return',
    type: require('graphql').GraphQLString,
  },
  updateDate: {
    description: 'Update date to return',
    type: require('graphql').GraphQLString,
  },
  sourceSystem: {
    description: 'The source system to return',
    type: require('graphql').GraphQLString,
  },
};

module.exports = { 
  forwardArgs,
  argsDefault: { args: { ...argsForwardType } } 
};