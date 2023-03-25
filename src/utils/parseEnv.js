const path = require('path');
let ecosystemDir = path.join(__dirname,'../../../../ecosystem.yaml');

function decrypt(key, type){  
  return type === 'local' ? Buffer.from(key, 'base64').toString('ascii') : key;
}

function extractEnv(){
const ENVIRONMENTS = process.argv.find(arg => arg?.['ENVIRONMENTS'])?.['ENVIRONMENTS'];
  return { ENVIRONMENTS };
}

function getEnv(useEnvMaster, environmentArg){
  const ecosystem = require('yamljs').load(ecosystemDir);
  let environment = useEnvMaster ? ecosystem.apps[0]['env']['NODE_ENV'] : environmentArg;
  environment = !environment ? ecosystem.apps[0]['env']['NODE_ENV'] : environment;
  environment = !environment ? process.env['NODE_ENV'] : environment;
  environment = !environment ? process.env.npm_config_NODE_ENV : environment; 
  
  let argGen = process.argv.find(arg => arg.includes?.('generator'));

  const env_ecosystem = ecosystem.apps[0][`env_${environment}`];  

  if(!env_ecosystem){
    console.log('Erro Fatal: Não foi encontrada a variável de ambiente environment:', environment);
    if(process.env['NODE_ENV']!=='test'){
      process.exit(0);
    }
  }
 
  const authType = env_ecosystem.GATEWAY_AUTH_TYPE;  
  const SCHEMA_YAML = require('yamljs').load( path.join(__dirname,'../../../../config/data-files/data-001/schemas/db-seeds.yaml'));

  const CORS_HEADER = [ ...ecosystem.apps[0]['env']['CORS_HEADER'], ...env_ecosystem.CORS_HEADER ];  

  const corsOptions = {
    urls: [ ...CORS_HEADER],
    origin: [ ...CORS_HEADER],
    allowedHeaders: [
      'Origin, X-Requested-With, Content-Type, Accept',
      'apollographql-client-version',
      'apollographql-client-name',
      'Authorization',
      'Referer',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Credentials',
      'Access-Control-Max-Age',
      'Access-Control-Expose-Headers',
      'Access-Control-Request-Headers',
      'Access-Control-Request-Method',
      'Host',
    ],
    methods: 'HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS, CONNECT, TRACE',
    credentials: true,
    preflightContinue: true,
  };
  
  const ENVIRONMENTS = {
    NODE_ENV: environment,
    AUTO_RESTART: env_ecosystem.AUTO_RESTART,
    DATABASE01_USER: decrypt(env_ecosystem.DATABASE01_USER, env_ecosystem.GATEWAY_AUTH_TYPE),
    DATABASE01_PASS: decrypt(env_ecosystem.DATABASE01_PASS, env_ecosystem.GATEWAY_AUTH_TYPE),
    DATABASE01_DB_NAME: decrypt(env_ecosystem.DATABASE01_DB_NAME, env_ecosystem.GATEWAY_AUTH_TYPE),
    DATABASE01_HOST: decrypt(env_ecosystem.DATABASE01_HOST, env_ecosystem.GATEWAY_AUTH_TYPE),
    DATABASE01_PORT: parseInt(env_ecosystem.DATABASE01_PORT),
    SERVICE_NAME: env_ecosystem.SERVICE_NAME,
    SERVICE_MOCK: env_ecosystem.SERVICE_MOCK,
    ENDPOINT_HEALTH: env_ecosystem.ENDPOINT_HEALTH,
    SCHEMA_CONFIG: env_ecosystem.SCHEMA_CONFIG,
    SCHEMA_YAML,
    GRAPHQL_PATH: env_ecosystem.GRAPHQL_PATH,
    PORT: parseInt(env_ecosystem.PORT),
    GATEWAY_AUTH: env_ecosystem.GATEWAY_AUTH,
    GATEWAY_AUTH_TYPE: env_ecosystem.GATEWAY_AUTH_TYPE,
    GATEWAY_CREDENTIALS_USER: env_ecosystem.GATEWAY_CREDENTIALS_USER,
    GATEWAY_CREDENTIALS_PASS: env_ecosystem.GATEWAY_CREDENTIALS_PASS,
    GATEWAY_URL: env_ecosystem.GATEWAY_URL,
    CORS_HEADER: corsOptions,
    API_URL: env_ecosystem.API_URL,
    GENERATOR: argGen
  }
  const isContain = Object.keys(process.argv).find(key => process.argv[key]?.['ENVIRONMENTS']);
  if(!isContain){
    process.argv.push({ ENVIRONMENTS });
  }else{
    Object.keys(process.argv).forEach(key => {
      if(process.argv[key]?.['ENVIRONMENTS']){
        process.argv[key]['ENVIRONMENTS'] = ENVIRONMENTS;
      }
    });
  } 
  return { ENVIRONMENTS };
}

module.exports.getEnv = getEnv;
module.exports.decrypt = decrypt;
module.exports.extractEnv = extractEnv;
