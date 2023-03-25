const { errorApolloFn } = require('./constantsFn');
const { ApolloError } = require('apollo-server-errors');

const responseConnectError = (error) => {
  const connError = {
    message: 'error: connecting to DB1',
    code: 'ERR_CONN_DB',
    stack: error.message,
    exception: {
      stacktrace: [''],
    },
  };

  const errConn = errorApolloFn(connError);
  trowError(errConn);  
};

const responseQueryError = (error, query) => {
  console.log('---');
  console.log(query);
  console.log('---');
  const qryError = {
    message: 'error: executing query',
    code: 'ERR_QUERY_DB',
    stack: error?.message,
    exception: {
      stacktrace: [query],
    },
  };
  const errQuery = errorApolloFn(qryError);
  trowError(errQuery);  
};

const responseQueryErrorCursor = (_) => {
  let customError = {
    message: 'Cursor inválido',
    code: 'BAD_OPERATION_CURSOR',
    stack: '',
    exception: {
      stacktrace: [''],
    },
  };
  const errCustom = errorApolloFn(customError);
  trowError(errCustom)
};

const responseQuerySuccess = (query) => {
  return {
    recordset: {
      success: [
        {
          result: 'Success',
          code: 'EXEC_QUERY_SUCCESS',
          message: 'success: query executed successfully',
          stack: query,
        },
      ],
    },
  };
};

function trowError(_error){

  const recordset = {
    "errors": [
      {
        "message": _error.message,

        "extensions": {
          "code": _error.code,
          "exception": {
            "stacktrace": [""]
          }
        }
      }
    ]

  }
  
  console.log(_error)
  return recordset
}

module.exports = {
  responseConnectError,
  responseQueryError,
  responseQuerySuccess,
  responseQueryErrorCursor,
};
