const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const yaml = require('js-yaml');


const getPattern = (pattern, seeds) => {
  let patArray = pattern.split('-');
  const groupkey = patArray[0];
  const itemGroup = `${patArray[1]}-${patArray[2]}`;
  const patGroups = seeds.patterns.find((_pat) => {
    const keys = Object.keys(_pat);
    return keys[0] == groupkey;
  });
  return patGroups[groupkey].find((_group) => {
    const groupkeys = Object.keys(_group);
    return groupkeys[0] == itemGroup;
  });  
};

const fieldGenerator = (column, countType, seeds, unionObjType) => {  
  const keys = Object.keys(column);
  const pattern = getPattern(column[keys[1]], seeds);
  const itensPat = column[keys[1]].split('-');
  const item = `${itensPat[1]}-${itensPat[2]}`;
  const columnTable = column[keys[countType + 1]]?.[0];
  const simpleColumn = columnTable == 'computed' ? 'computed' : columnTable;
  const sqlMonsterColumn = { sqlColumn: `${simpleColumn}` };
  let castDefinitions = undefined;
  let sqlMonsterExpr = { sqlExpr: '' };  
  if (itensPat[1] == 'idr' || itensPat[1] == 'gblr' || itensPat[1] == 'cler') {
    let row = pattern['row']
    let cast = pattern['cast'];
    cast = `${cast}`.replace('>>COL', `${simpleColumn}`);
    let concat = pattern['concat'];
    concat = `(SELECT ${concat?concat:'NULL'} AS ${keys[0]})`.replace('>>CAST', cast)
    .replace('>>UNIONTYPE', unionObjType)
    .replace('>>ROW', `${row}`); 
    sqlMonsterExpr.sqlExpr = concat.toString().replace('OVER(\t', 'OVER(');    
  } else if (columnTable=='computed') { 
    let cast = pattern['cast'];
    cast = `${cast}`.replace('>>COL', `computed`);
    let concat = pattern['concat'];
    concat = `(SELECT ${concat?concat:'NULL'} AS ${keys[0]})`.replace('>>CAST', cast).replace('>>UNIONTYPE', unionObjType);
    sqlMonsterExpr.sqlExpr = concat.toString();
  }else if (pattern[item] == 'expr') {
    let cast = pattern['cast'];
    cast = `${cast}`.replace('>>COL', `${simpleColumn}`);
    let concat = pattern['concat'];
    concat = `(SELECT ${concat} AS ${keys[0]})`.replace('>>CAST', cast).replace('>>UNIONTYPE', unionObjType);
    sqlMonsterExpr.sqlExpr = concat.toString();
  } else if (pattern[item] == 'column' && pattern.type !== 'DATETIME') {
    castDefinitions = [pattern.type, pattern.length, pattern.scale, pattern.precision];
  }

  const sqlMonster = pattern[item] == 'expr' || columnTable=='computed' ? sqlMonsterExpr : sqlMonsterColumn;

  return {
    name: keys[0],
    type: pattern.gqlType,
    description: 'ND',
    simpleColumn,
    compositeColumn: [simpleColumn],
    extensions: {
      joinMonster: {
        ...sqlMonster,
      },
    },
    castDefinitions,
  };
};

const listSeedTables = () => {
  const seedTablesDir   = path.join(__dirname, '../../../../../../../','config/','data-files/data-001/tables/');
  const seedTables = [];
  require('fs')
  .readdirSync(seedTablesDir)
  .forEach(function(file) {
    if (file.match(/\.yaml$/) !== null && file !== 'index.js') {
      seedTables.push(file);
    }
  });
  return { seedTables }
}

const generator = (isLoad) =>
  new Promise( async (resolve, reject) => {
    if (!isLoad) resolve('Not load parse seeds generator defined');
    const filePatternsDb1 = path.join(__dirname, `../../../../../../../config/patterns/pattern-001.yaml`);
    const seedTablesDir   = path.join(__dirname, '../../../../../../../','config/','data-files/data-001/tables/');
    const patterns = YAML.load(filePatternsDb1);
    const { seedTables } = listSeedTables();
    
    let seedGenerates = []
    let seeds = [];
    seedTables.forEach((_seedTable) => {
      const _table = YAML.load(`${seedTablesDir}${_seedTable}`);
      seeds.push({
        ..._table,
        patterns: patterns.patterns,
      });
    });

    let schemaDefinitions = {};
    let countTypes = 1;
    let seedTable = [];

    seeds.forEach((_seed) => {
      countTypes = 1;

      seedTable.push({
        name: _seed.seed.toLowerCase(),
        objTypes: _seed.unions.map((_unionObjType) => _unionObjType.objType),
        types: _seed.unions.map((_unionElement) => {
          let unionType = {
            type: _unionElement.type,
            objType: _unionElement.objType,
            tableName: _unionElement.tableName,
            active: _unionElement.active,
            fields: _seed.columns.map((_columnElement) => {
              return fieldGenerator(_columnElement, countTypes, _seed, _unionElement.type);
            }),
          };
          countTypes++;
          return unionType;
        }),
      });
    });

    schemaDefinitions = {
      tables: seedTable,
    };

    const fileName = 'db-seeds.yaml';
    const pathFile = path.join(__dirname, '../../../../../../../config/data-files/data-001/schemas/', `${fileName}`);
    const jsonToYaml = async () => {
      fs.writeFileSync(pathFile, yaml.dump(schemaDefinitions));
      seedGenerates.push(pathFile)
    };

    await jsonToYaml();

    resolve(seedGenerates);
  });

module.exports.generator = generator;

