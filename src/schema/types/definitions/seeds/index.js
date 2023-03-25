const path = require('path');
const { upperCaseFirstLetter } = require('../../../../utils/constantsFn');
let seedsDir = path.join(__dirname,'../../../../../../../','config/','seeds/');
const { generateFieldsAndSql } = require('../../../utils/schemaTypes');
  require('fs')
    .readdirSync(seedsDir)
    .forEach( function(_file_) {
      
      if (_file_.match(/\.yaml$/) !== null && _file_ !== 'index.js' && _file_ !== 'types.js') {

        const _path_file = `${seedsDir+_file_}`;
        const _seedType = require('yamljs').load(_path_file);
        let _typeName_ = _file_.replace('-seed.yaml', '');


        let name = _file_.replace('-seed.yaml', '');
        name =  name.split('-');
        if(name.length===0){
          name = `${name[0]}`
        }else{
          let nameArray = name;
          name = ''
          nameArray.forEach((partName, index) => {
            name += index>0 ? nameArray[index][0].toUpperCase()+ nameArray[index].slice(1) : partName
          });
        }        

        _typeName_ = upperCaseFirstLetter(name);
        const unionTypes = _seedType['unionTypes'];
        const objFields = _seedType['objFields'];
        
        const {FieldsForType, SQL} =  generateFieldsAndSql(unionTypes, objFields);
        exports[_typeName_] = { FieldsForType, SQL, defs: { unionTypes, objFields }};
      }
    });
  
  
  