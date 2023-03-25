const { execute } = require('../gateway/db1');
async function execQuery(query){
  const { recordset } = await execute(query);
  return recordset;
};

exports.execQuery = execQuery;
