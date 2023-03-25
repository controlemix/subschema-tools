const path = require('path');
let typesDir = path.join(__dirname,'../../../../../config' );
let typesDir2 =path.join(__dirname,'../../../src/schema/types/definitions/seeds/' );
require('fs').readdirSync(typesDir + '/seeds').forEach(function(file) {
  if (file.match(/\.yaml$/) !== null && file !== 'index.js' ) {
    let _typeName = file.replace('-seed.yaml', '');

    _typeName =  _typeName.split('-');
    if(_typeName.length===0){
      _typeName = `${_typeName[0]}`
    }else{
      let nameArray = _typeName;
      _typeName = ''
      nameArray.forEach((partName, index) => {
        _typeName += index>0 ? nameArray[index][0].toUpperCase()+ nameArray[index].slice(1) : partName
      });
    }

    exports[_typeName] = {...require(typesDir2)[_typeName]};
  }
});



