const sql = require('mssql');
const {
  responseConnectError,
  responseQuerySuccess,
  responseQueryError,
  responseQueryErrorCursor,
} = require('../../utils/responsesPool');

function getConnectionConfig() {
  const {
    DATABASE01_USER,
    DATABASE01_DB_NAME,
    DATABASE01_HOST,
    DATABASE01_PASS,
    DATABASE01_PORT,
    NODE_ENV
  } = require('../../utils/parseEnv').extractEnv().ENVIRONMENTS;
  return {
    user: DATABASE01_USER,
    password: DATABASE01_PASS,
    database: DATABASE01_DB_NAME,
    server: DATABASE01_HOST,
    port: DATABASE01_PORT,
    pool: {
      max: 50,
      min: 0,
      idleTimeoutMillis: NODE_ENV==='test' ? 1000 : 90000, // 30 seconds
    },
    requestTimeout: NODE_ENV==='test' ? 1000 : 90000, // 30 seconds
    connectionTimeout: NODE_ENV==='test' ? 1000 : 90000, // 30 seconds
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
}

let pool1 = undefined;
let pool1Connect = undefined;

 function pool1Query(query, _pool1) {
  return new Promise( async function(resolve, reject) {    
    let rows = {recordset:[]};
    try {
      rows = await _pool1.query(query)
      responseQuerySuccess(query);
      resolve(rows);
    } catch (error) {
      responseQueryError(error, query);
      resolve(rows);
    }
 
  });
}

async function poolConnect() {
    const config = getConnectionConfig();
    try {
      pool1Connect = new sql.ConnectionPool(config);
      pool1 = await pool1Connect.connect();
      return pool1Connect;
    } catch (error) {
      pool1 = undefined;
      pool1Connect = undefined;
      responseConnectError(error)
      return pool1Connect;
    }
  
}

async function execute(query) {
  if (query.includes('NaN')) {
    return responseQueryErrorCursor();
  }
  const _pool1 = !pool1 ? await poolConnect() : pool1;
  if(_pool1 === undefined) {
    return responseConnectError();
  } else {
    return await pool1Query(query, _pool1);
  }
  // const resp = await pool1Query(query, _pool1);
  // return resp;
}

module.exports = { execute };
