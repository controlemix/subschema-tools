const { writeFile, readFile } = require('../schema/utils/schemaFsSync');
const tx2 = require('./actionsHandles');

const fixJoinMonster = (isLoad, NODE_ENV) =>
  new Promise( async (resolve, _reject) => {
  if(!isLoad)resolve('Not fix defined');  
  let isFix = false;
  const fileFix1 = await readFile('node_modules/join-monster/dist/query-ast-to-sql-ast/index.js');
  const fileFix2 = await readFile('node_modules/join-monster/dist/alias-namespace.js');
  const fileFix4 = await readFile('node_modules/join-monster/dist/stringifiers/dialects/oracle.js');
  isFix = fileFix1.includes('sqlASTNode.args = (0, _values.getArgumentValues)(field, queryASTNode, this.variableValues);');
  isFix = !isFix ? !fileFix4.includes("const OFFSET_FETCH_ALL_CONSTANT = 'ALL'") : isFix;
  if (isFix) { 
    let dataFix1 = fileFix1.replace( 'sqlASTNode.args = (0, _values.getArgumentValues)(field, queryASTNode, this.variableValues);', ' if (field && field.args && !Array.isArray(field.args)) field.args = [field.args];sqlASTNode.args=(0,_values.getArgumentValues)(field,queryASTNode,this.variableValues); ' );
    dataFix1 = dataFix1.replace( "const namespace = new _aliasNamespace.default(options.dialect === 'oracle' ? true : options.minify);", 'const namespace = new _aliasNamespace.default(options.minify);' )
    let dataFix2 = fileFix2.replace('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz');
    let dataFix4 = fileFix4.replace('var _lodash = require("lodash");', "var _lodash  =  require('lodash'); const OFFSET_FETCH_ALL_CONSTANT = 'ALL'; " );
    let dataFix5 =   dataFix4.replace('OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY',"OFFSET ${offset} ROWS ${limit !== OFFSET_FETCH_ALL_CONSTANT ? `FETCH NEXT ${limit} ROWS ONLY` : ''}");
    let dataFix6 =   dataFix5.replace('OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY',"OFFSET ${offset} ROWS ${limit !== OFFSET_FETCH_ALL_CONSTANT ? `FETCH NEXT ${limit} ROWS ONLY` : ''}");

    await writeFile('node_modules/join-monster/dist/query-ast-to-sql-ast/index.js', dataFix1, 'utf8');
    await writeFile('node_modules/join-monster/dist/alias-namespace.js', dataFix2, 'utf8');
    await writeFile('node_modules/join-monster/dist/stringifiers/dialects/oracle.js', dataFix6, 'utf8');

    tx2?.emit?.('PROCESS_LOG', {
      result: 'Fix ok!',
      code: 'FIX_MODULES',
      command: '',
      message: 'Modules ready for use, necessary restart API',
      stack: ''
    });

    tx2?.emit?.('RESTART_APP', NODE_ENV); 
  }
  resolve(isFix)
});

module.exports.fixJoinMonster = fixJoinMonster;
