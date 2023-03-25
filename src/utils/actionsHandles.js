const tx2 = require('tx2');

tx2.on('RESTART_APP', function(NODE_ENV) {
  exit(NODE_ENV);
});

tx2.on('SIGINT', function(NODE_ENV) {
  exit(NODE_ENV);
});

tx2.on('KILL', function(NODE_ENV) {
  exit(NODE_ENV);
});

tx2.on('READY', function(_param) {
  const {SERVICE_NAME, NODE_ENV, API_URL, PATH} = _param;  
  setTimeout(() => {
    process?.send?.('ready');
  },100);  
  console.log(`\n---------  info  ------------\n\nServer API GraphQL is ready\nService: ${SERVICE_NAME}\nEnvironment: ${NODE_ENV}\n\n${API_URL}${PATH}\n\n-----------------------------\n`);
});

tx2.on('PROCESS_LOG', function(param) {
  console.log({
    result: param.result,
    code: param.code,
    command: param.command,
    message: param.message,
    stack: param.stack,
  });
});

function exit(_NODE_ENV) {
  console.log(`\n---------  info  ------------\n\nRequest stop incoming API Environment: ${_NODE_ENV} exiting now!\n\n-----------------------------\n`);
  if(_NODE_ENV!=='test'){
    setTimeout(() => {
      process.exit(0);
    },3000);
  }
    
}



module.exports.tx2 = tx2;
