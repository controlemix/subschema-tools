const joinMonster = require('join-monster').default;
const GraphQLDate = require('graphql-date');
const { GraphQLID, GraphQLString, GraphQLNonNull, GraphQLFloat, GraphQLInt } = require('graphql');
const { globalIdField } = require('graphql-relay');
const { nodeInterface } = require('./schemaNodes');
const { getTableUnion, getColumn } = require('./schemaData');
const { argsConnectionValidation } = require('./schemaValidations');
const { execQuery } = require('../../controllers/default.controller');
const { validateOperation } = require('./schemaOperation');
const { extractEnv } = require('../../utils/parseEnv');
const options = { dialect: 'oracle', minify: false };
const path = require('path');

const extractSQLFromObjectType = (fields, tableName, typeTable, typeObj, tableDb) => {
  const strippedFields = stripFieldsObjectType(fields, tableName, typeTable, typeObj);
  return factorySQL(strippedFields, typeObj, tableDb);
};

function stripFieldsObjectType(gqlFields, tableName, typeTable, typeObj) {
  let schemaDir = path.join(__dirname, `../../../../../config/data-files/data-001/schemas/db-seeds.yaml`);
  const SCHEMA_YAML = require('yamljs').load(schemaDir);

  const tableFound = SCHEMA_YAML.tables.find((table) => table.name === tableName && table.objTypes.includes(typeObj));
  if (!tableFound) {
    return undefined;
  }
  const tableTypeFound = tableFound.types.find((table) => table.type === typeTable);
  const fields = [];
  Object.keys(gqlFields).forEach((key) => {
    if (key !== '__type__') {
      const tableConfig = tableTypeFound.fields.find((text) => text.name === key);
      let stripedExp = undefined;

      if (tableConfig?.extensions?.joinMonster?.sqlExpr) {
        stripedExp = tableConfig.extensions.joinMonster.sqlExpr;
        const startExt = stripedExp.substring(0, 1);
        if (startExt === '(') {
          stripedExp = stripedExp.substring(1, stripedExp.length - 1);
        }
      }
      const { castDefinitions } = tableConfig;
      const field = {
        name: key,
        type: gqlFields[key].type.name || '',
        sqlColumn: gqlFields[key].extensions.joinMonster.sqlColumn,
        sqlExpr: stripedExp,
        castDefinitions,
      };
      fields.push(field);
    }
  });
  return fields;
}

function identityColumn(field) {
  if (field.sqlExpr) {
    const lowerCaseStripedExp = field.sqlExpr.toLowerCase();
    const pos = lowerCaseStripedExp.indexOf(' as ');
    const columnEnd = field.sqlExpr.substring(pos + 4, field.sqlExpr.length);
    let column = field.sqlExpr;
    let columnStart = field.sqlExpr.substring(0, pos + 1);
    if (lowerCaseStripedExp.includes('select')) {
      const posSel = columnStart.indexOf('select');
      column = `${columnStart.substring(posSel + 7, columnStart.length - 1)} AS ${columnEnd}`;
    }
    return column;
  } else if (field.castDefinitions) {
    switch (field.castDefinitions[0]) {
      case 'VARCHAR':
        return `CAST(${field.sqlColumn} AS VARCHAR(${field.castDefinitions[1]})) AS ${field.name}`;
      case 'DECIMAL':
        return `CAST(${field.sqlColumn} AS DECIMAL(${field.castDefinitions[1]},${field.castDefinitions[3]})) AS ${field.name}`;
      default:
        return `${field.sqlColumn} AS ${field.name}`;
    }
  } else {
    return `${field.sqlColumn} AS ${field.name}`;
  }
}
const factorySQL = (fields, objUnion, tableDb) => {
  if (!fields) {
    return undefined;
  }
  let sqlFields = '';
  fields.forEach((field) => {
    if (field.type) {
      sqlFields += `,${identityColumn(field)}`;
    } else {
      if (field.name === 'id' || field.name === 'globalId') {
        sqlFields += `,${identityColumn(field)}`;
      } else {
        sqlFields += `,0 as ${field.name}`;
      }
    }
  });
  sqlFields = sqlFields.substring(1);
  return `SELECT ${sqlFields} ,'${objUnion}' AS '$type' FROM ${tableDb} `;
};

function parseFieldType(_fieldYAML, _preField) {
  if (_fieldYAML.type === 'GraphQLString') {
    return { ..._preField, type: GraphQLString };
  }
  if (_fieldYAML.type === 'GraphQLInt') {
    return { ..._preField, type: GraphQLInt };
  }
  if (_fieldYAML.type === 'GraphQLFloat') {
    return { ..._preField, type: GraphQLFloat };
  }
  if (_fieldYAML.type === 'GraphQLDate') {
    return { ..._preField, type: GraphQLDate };
  }
}

function fieldsObjectBuilder(objFields, tableGQL, widthExtensions, table, tableType) {
  let unionFieldsFinal = {};
  const { SCHEMA_YAML } = extractEnv().ENVIRONMENTS;
  const tableFound = SCHEMA_YAML.tables.find((tableYAML) => tableYAML.name.toLowerCase() === table);
  const tableTypeFound = tableFound.types.find((typesYAML) => typesYAML.type === tableType);
  const unionFields = objFields.map((field) => {
    const _field = Object.keys(field)[0];
    const _isActive = field[_field].active;
    if (_isActive) {
      const collumn = getColumn(tableGQL, Object.keys(field).toString());
      let preField = {
        description: collumn.description,
        extensions: widthExtensions ? collumn.extensions : {},
      };

      if (
        Object.keys(field).toString() === 'id' ||
        collumn.type.name === 'ID' ||
        Object.keys(field).toString() === 'globalId'
      ) {
        preField = { ...preField, type: new GraphQLNonNull(GraphQLID), ...globalIdField() };
      } else {
        const fieldYAML = tableTypeFound.fields.find((tableTypeYAML) => tableTypeYAML.name === Object.keys(field).toString());
        preField = parseFieldType(fieldYAML, preField);
      }
      return {
        [Object.keys(field)[0]]: { ...preField },
      };
    }
  });

  unionFields.map((field) => {
    unionFieldsFinal = { ...unionFieldsFinal, ...field };
    return { ...unionFieldsFinal, ...field };
  });
  return unionFieldsFinal;
}

function generateFieldsAndSql(unionTypes, objFields) {
  let sqlArray = [];
  let FieldsForType = {};
  unionTypes.forEach(({ tableName, typeName, objectTypeName }) => {
    const tableGQL = getTableUnion(tableName, objectTypeName, typeName);
    if (!tableGQL) {
      console.log('UNDEFINED == ', tableName, objectTypeName, typeName);
      return { FieldsForType: undefined, SQL: undefined };
    }
    const objFieldsInstance = fieldsObjectBuilder(objFields, tableGQL, true, tableName, tableGQL.type);
    const sqlExtracted = extractSQLFromObjectType(objFieldsInstance, tableName, typeName, objectTypeName, tableGQL.tableName);
    FieldsForType = fieldsObjectBuilder(objFields, tableGQL, false, tableName, tableGQL.type);
    sqlArray.push(sqlExtracted);
  });
  let sqlTemp = '';
  let count = 0;
  sqlArray.forEach((sql) => {
    if (count === 0) {
      sqlTemp = sql;
    } else {
      sqlTemp = sqlTemp + ' UNION ' + sql;
    }
    count++;
  });
  const SQL = ` (${sqlTemp}) `;
  return { FieldsForType, SQL };
}

function generateExtensions(SQL, uniqueKey, condition, isPaginate, _optionsAdapt) {
  const { orderBy } = _optionsAdapt;
  let extType = {
    joinMonster: {
      sqlTable: SQL,
      uniqueKey: uniqueKey,
      orderBy: orderBy ? orderBy : uniqueKey,
      as: '$type',
      alwaysFetch: '$type',
      where: (table, args, context, sqlAST) => {
        return condition('', table, args);
      },
    },
  };
  if (isPaginate) {
    extType = {
      joinMonster: {
        sqlPaginate: true,
        sqlPageLimit: 'ALL',
        ...extType.joinMonster,
      },
    };
  }
  return extType;
}

function countForConnection(argsType, _info) {
  if ((_info.returnType.name) && (_info.returnType.name.includes('Connection'))) {
  const seedsDir = path.join(__dirname, '../types/definitions/seeds');
   const { lowerCaseFirstLetter } = require('../../utils/constantsFn');
   const { SQL } = require(seedsDir)[_info.returnType.name.replace('Connection','')];
   const operation=lowerCaseFirstLetter(_info.returnType.name.replace('Connection',''));
   const condition = conditionWhere(operation, argsType);
   let columns = '';
   Object.keys(argsType).forEach((field) => {
     if (field != 'first' && field != 'after') {
       columns += ` ${field},`
     }
   });
   const opeIsValid = validateOperation(operation); 
     if(opeIsValid){
       return `WITH TempResult AS( SELECT ${columns.substring(0, columns.length-1)} FROM ${SQL} "${operation}" WHERE ${condition} ) `;    
   }
 }
 return ''
}



function generateResolversDefault(resolversIncludes) {
  let resolversDefault = undefined;
  const { resolver, resolveType } = resolversIncludes;
  if (resolver) {
    resolversDefault = {
      resolve: (_parent, _args, context, resolveInfo) => {
        argsConnectionValidation(_args, resolveInfo);
        return joinMonster(resolveInfo, context, (sql) => { 
          let sqlFinal = sql;
          if ((resolveInfo.returnType.name) && (resolveInfo.returnType.name.includes('Connection'))) {
            const tempRes = countForConnection(_args, resolveInfo)
            let querySanitize = sql.replace('count(*) OVER () AS "$total"', '(SELECT COUNT(*) FROM TempResult) AS "$total"');
            sqlFinal = `${tempRes}  ${querySanitize}`
          }
          return execQuery(sqlFinal)
        }, options);
      },
    };
  }

  if (resolveType) {
    resolversDefault = {
      ...resolversDefault,
      resolveType: (obj) => {
        return obj.$type;
      },
    };
  }
  return resolversDefault;
}

function generateAdaptType(SQL, uniqueKey, condition, isPaginate, args, fields, optionsAdapt) {
  const { isNode, name } = optionsAdapt;
  const resolvers = generateResolversDefault(optionsAdapt);
  let adaptType = {
    name, 
    extensions: generateExtensions(SQL, uniqueKey, condition, isPaginate, optionsAdapt),
    args: { ...args },
    fields: { ...fields }    
  }
  if (isNode) { adaptType = { ...adaptType, interfaces: [nodeInterface]}}
  if (resolvers !== undefined) { adaptType = { ...adaptType, ...resolvers }}
  return adaptType;
}

const conditionWhere = (table, args, conditions) => {
  const nameTableCondition = table;  
  let whereCondition = conditions ? ` 1=1 ${conditions} ` : ' 1=1 ' ;
  Object.keys(args).forEach((field) => {
    if (field != 'first' && field != 'after') {

      if ((field === 'loadDate') && (args[field])) {
        whereCondition += ` AND CONVERT(DATE, ${nameTableCondition}.loadDate)  = '${args[field]}' `
      } else if ((field === 'updateDate') && (args[field])) {
        whereCondition += ` AND CONVERT(DATE, ${nameTableCondition}.updateDate)  = '${args[field]}' `
      } 
      else if (field === 'sourceSystem') {
        whereCondition += ` AND ${nameTableCondition}."sourceSystem" = '${args[field]}' `
      } 
      else if (args[field]) {
        whereCondition += ` AND ${nameTableCondition}."${field}" = '${args[field]}' `
      }
    } 
  });
  return (whereCondition);
}

const conditionWhereEntity = (argsVar) => {
  const nameTableCondition = '"_entities"';  
  let whereCondition = ` WHERE 1=1 `;
  Object.keys(argsVar.representations[0]).forEach((field) => {
    if(field!=='__typename' && field!=='id'){
       whereCondition += ` AND ${nameTableCondition}."${field}" = '${argsVar.representations[0][field]}' `
    }
  });
  return (whereCondition);
}

const resolverEntities = () => {
  const resolvers = {
  Query: {
    _entities: {
      resolve: async (_parent, args, context, resolveInfo) => {
        const data = await joinMonster(
          resolveInfo,
          context,
           sql => {
             const sqlFinal = `SELECT ${sql.substring(6,sql.length)} ${conditionWhereEntity(args)}`;
            return  execQuery(sqlFinal);
          }, { dialect: 'oracle', minify: false }
        );
        return Object.keys(data).map((key) => {
          return { ...data[key], __typename: args.representations[0].__typename };
        });
      },
    },
  },
}
return {resolvers}
};

module.exports = {
  extractSQLFromObjectType,
  fieldsObjectBuilder,
  generateFieldsAndSql,
  generateExtensions,
  generateResolversDefault,
  generateAdaptType,
  conditionWhere,
  resolverEntities,
  conditionWhereEntity,
};
