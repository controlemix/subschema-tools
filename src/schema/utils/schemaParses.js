const path = require('path');
const fs = require('fs');

async function jsonToYaml(pathFile, seedFile){ 
  return fs.writeFileSync(pathFile, require('js-yaml').dump(seedFile));
}

const parseSeedName = (seedName) => {
  if(seedName.length===0){
    seedName = seedName[0][0].toUpperCase() + seedName[0][0].slice(1)
  }else{
    let nameArray = seedName;
    seedName = ''
    nameArray.forEach((partName, index) => {
      seedName += index>0 ? nameArray[index][0].toUpperCase()+ nameArray[index].slice(1) : partName
    });
  }
  return seedName;
}

const parseSeeds = (isLoad) => 
  new Promise((resolve, _reject) => {
    if(!isLoad)resolve('Not load parse seeds defined');

    let seedsDir = path.join(__dirname,'../../../../../','config/','seeds/');
    let files = require('fs').readdirSync(seedsDir);
    let seeds = [...files];
    let seedGenerates = []
    
    seeds.forEach( async (seed) => {
      
      if (!seed.includes('fragments') && !seed.includes('index.js') && !seed.includes('.json')){
        let seedName = seed.replace('-seed.yaml', '');

        seedName =  seedName.split('-');
        seedName = parseSeedName(seedName);
        seedName = seedName.substring(0, 1).toUpperCase() + seedName.substring(1, seedName.length)
        const seedSplit = [seedName]
        const type = require('yamljs').load( seedsDir+seed );
        const { unionTypes, objFields } = type;
        const isActive = unionTypes.find((type__) => type__.active) ? true : false;
        const _unions = unionTypes.map((_union) => _union);
        const _columns  = objFields.map((_field) => _field);
        let unions = []
        
        _unions.forEach((_union) => {
          unions.push({
            type: _union.typeName,
            objType: _union.objectTypeName,
            tableName: _union.tableDb,
            active: _union.active,
          });
        });
  
        let unionsType = '' 
        let strColumn = ''
        
        _columns.forEach((_column) => {
          const keys = Object.keys(_column)
          _column[keys[0]].columns.forEach(_union => {
              unionsType = ''
              _column[keys[0]].columns.forEach((unionElement, num=0) => {
                  unionsType += `"union${num+1}":["${unionElement}"],`
              });
          });
          strColumn += `{"${keys[0]}": ${_column[keys[0]].active}, "pattern": "${_column[keys[0]].pattern}", ${unionsType.substring(0,unionsType.length-1)} },`;
        });
        
        let seedFile = {
          seed: seedSplit[0].toLowerCase(),
          active: isActive,
          unions,
          columns: JSON.parse('['+strColumn.substring(0,strColumn.length-1)+']')        
        };
  
        let fileName = `${seedSplit[0]}.yaml`;
        const pathFile = path.join(__dirname, '../../../../../config/data-files/data-001/tables', `${fileName}`);
        seedGenerates.push(pathFile)
        await jsonToYaml(pathFile, seedFile);
      }
      
    })
    resolve(seedGenerates)
  })

module.exports = {
  parseSeeds
}