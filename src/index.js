function startServer(){
  return new Promise(async (resolve, _reject) => {
    const clc = require('cli-color');
    let environmentArg = '';
    let useEnvMaster = false;

    if (process.env['NODE_ENV'] == 'test') {
      environmentArg = 'test';
    } else {
      environmentArg = process.argv.find((env) => env.includes('environment'));
      environmentArg = environmentArg ? environmentArg.split('=')[1] : undefined;
      useEnvMaster = environmentArg ? false : true;
    }
    const {getEnv} = require('./utils/parseEnv');

    const { ENVIRONMENTS } = getEnv(useEnvMaster, environmentArg);
    const { server, app, schema } = await createApolloServer(ENVIRONMENTS);
    
    const { API_URL, SERVICE_NAME, GRAPHQL_PATH, GENERATOR } = ENVIRONMENTS;    
    const param = { SERVICE_NAME, NODE_ENV: ENVIRONMENTS.NODE_ENV, API_URL, PATH: GRAPHQL_PATH };

    const { operationBuilder } = require('./schema/utils/schemaOperation');
    const { operationsJob } = require('./schema/utils/jobs/operationsJob');
    await operationBuilder(schema, ENVIRONMENTS.NODE_ENV);
    await operationsJob();

    let listsForTests = [];

    try {
      listsForTests = require('./utils/listsForTests').getListsForTests();
    } catch (error) {
      
    }
    
    const { tx2 } = require('./utils/actionsHandles');
    if(GENERATOR){       
      setTimeout(() => { process.exit(0); },3000);
      tx2.emit('READY', param);
      resolve({ server, app, schema, listsForTests }); 
    }else{
      if(ENVIRONMENTS.NODE_ENV !== 'test'){
        console.log('');
        console.log(clc.magentaBright('generating docs schedule start in 5 seconds'));
        console.log('');
        setTimeout( async () => {
          await require('./schema/utils/schemaDoc').docsGenerator(server.config.schema, ENVIRONMENTS.NODE_ENV , API_URL + GRAPHQL_PATH, SERVICE_NAME);
        }, 5000);
      }
      tx2.emit('READY', param);
      resolve({ server, app, schema, listsForTests });
    } 
  });
}

async function createApolloServer(ENVIRONMENTS){
  const { ApolloServer } = require('apollo-server-express');
  const { ApolloServerPluginDrainHttpServer, ApolloServerPluginInlineTrace } = require('apollo-server-core');
  const http = require('http');
  const express = require('express');
  const { builderSubGraph } = require('./schema/utils/schemaSubgraph');
  const { applyMiddlewareApp } = require('./schema/utils/schemaRoutes');
  const { executionPlugin } = require('./schema/utils');
  const { preLoad } = require('./utils/preLoad');
  
  
  const { PORT, API_URL, NODE_ENV, SERVICE_NAME, GRAPHQL_PATH, SERVICE_MOCK, GENERATOR } = ENVIRONMENTS;
  
  
  await preLoad({ NODE_ENV, loadDefinitions: true, loadGenerator: true, loadFixes: true });

  const app = express();
  const httpServer = http.createServer(app);
  const mocks = {}
  
  await applyMiddlewareApp(app, ENVIRONMENTS, express);  
  const { schema } = builderSubGraph(NODE_ENV);
 
  
  let apolloDefinition = {
    schema,
    subscriptions: false,
    tracing: true,
    engine: true,
    introspection: true,
    csrfPrevention: false,
    debug: true,
    HealthCheck: true,
    cache: 'bounded',
    stopOnTerminationSignals: true,
    stopGracePeriodMillis: 3000,
    cors: false,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), 
      ApolloServerPluginInlineTrace({ tracing: true }), 
      executionPlugin],
  };
  
  if (SERVICE_MOCK == 1) {
    let _mocks = {
      ...mocks,
      String: () => 'Fix',
      Date: () => {
        return new Date();
      },
    };
    apolloDefinition.mocks = _mocks;
  }


  const server = new ApolloServer(apolloDefinition);
  await server.start();
  server.applyMiddleware({ app, path: GRAPHQL_PATH, cors: false });
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  return { server, app, schema, listsForTests: [] };
};

function getFieldsAndSQL(type){
  return require('./schema/types/definitions/seeds')[type];
}

module.exports = {
  createApolloServer,
  startServer,
  getFieldsAndSQL,
  upperCaseFirstLetter: require('./utils/constantsFn.js').upperCaseFirstLetter,
  lowerCaseFirstLetter: require('./utils/constantsFn.js').lowerCaseFirstLetter,
  conditionWhere: require('./schema/utils/schemaTypes').conditionWhere,
  generateAdaptType: require('./schema/utils/schemaTypes').generateAdaptType,
};




