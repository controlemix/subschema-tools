function getHeaderAuthBasic(){
  const { GATEWAY_CREDENTIALS_USER, GATEWAY_CREDENTIALS_PASS }  = require('../../utils/parseEnv').extractEnv().ENVIRONMENTS;
  return Buffer.from(GATEWAY_CREDENTIALS_USER + ':' + GATEWAY_CREDENTIALS_PASS).toString('base64');
}
const initialState = { headers: { Authorization: `Basic ${getHeaderAuthBasic()}`}};
const executionPlugin = {
  async requestDidStart(operation) {
    if(operation?.request?.operationName && operation?.request?.variables !== {}  ) {
      if (operation?.request?.operationName?.includes('Frag')) {
        let operationName = operation.request.operationName;
        const { query } = require('./schemaOperation').getOperation(operationName, null);
        operation.request.query = query;
      }
    }
    if (operation?.request?.operationName?.includes('_entities')||operation?.request?.query?.includes('_entities')) {
      const _v0_representations = operation?.request?.variables?._v0_representations?.[0]?.__typename;
      const _representations = operation?.request?.variables?.representations?.[0]?.__typename
      const type = _v0_representations ? _v0_representations : _representations;
      let variables = operation?.request?.variables?.representations?.[0]
      variables = variables ? variables : operation?.request?.variables?._v0_representations?.[0]
      require('./schemaValidations').argsEntitiesValidation(type, variables);
      if(operation?.schema?._typeMap){
        operation.schema._typeMap._Entity.extensions = operation.schema?._typeMap[type]?.extensions;
      }
    }  
  },
};

module.exports = {
  initialState,
  executionPlugin,
  getHeaderAuthBasic
};
