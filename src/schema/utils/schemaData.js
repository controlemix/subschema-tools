const { errorTry } = require('../../utils/constantsFn');
const { extractEnv } = require('../../utils/parseEnv');

const getTableUnion = (tableName, _objType, type) => {
  
  const { SCHEMA_YAML }  = extractEnv().ENVIRONMENTS;
  if(!SCHEMA_YAML?.tables){
    process.exit(0)
  }
  const _tables = SCHEMA_YAML.tables;
  
  const tableSchema = _tables.find((table) => {   
    return table.name.toLowerCase() === tableName;
  });
  if(!tableSchema){
    return
  }

  const schemaTypes = tableSchema.types.map((text) => {    
    return text.type;
  });

  const tableTypeFound = tableSchema.types.find((typeSchema) => {
      return typeSchema.type === type && typeSchema.active;
  });

  if(!tableTypeFound){ return }

  return {
    name: tableName,
    tableName: tableTypeFound.tableName,
    objTypes: tableSchema.objTypes,
    type: tableTypeFound.type,
    schemaTypes,
    fields: tableTypeFound.fields,
  };
};

const simpleColumn = (table, columnName) => {
  return table.fields.find((field) => field.name === columnName).simpleColumn;
};
const unionSQLColumn = (table, columnName) => {
    const sqlCollumn = table.fields.find((field) => field.name === columnName).simpleColumn;
    return ` ${sqlCollumn} AS ${columnName} `;
};
const getColumn = (table, columnName) => {
  try {
    const column = table.fields.find((field) => field.name === columnName);
    if (column.extensions.joinMonster.sqlExpr) {
      const sqlExpr = column.extensions.joinMonster.sqlExpr;
      column.extensions.joinMonster.sqlExpr = () => sqlExpr;
    }
    return { type: column.type, description: column.description, extensions: column.extensions };
  } catch (error) {
    throw errorTry(`Na tabela ${table.name} está faltando o campo ${columnName} no schema`);
  }
};

module.exports = {
  simpleColumn,
  getColumn,
  getTableUnion,
  unionSQLColumn  
};
