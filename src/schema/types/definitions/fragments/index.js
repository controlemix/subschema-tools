const { upperCaseFirstLetter } = require('../../../../utils/constantsFn');
let fragmentsDefs = [];
require('fs').readdirSync('config/seeds').forEach(function(file) {
  if (file.match(/\.yaml$/) !== null && file !== 'index.js') {
    let name = file.replace('-seed.yaml', '');
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
    const { args } = {...require('../../args')[name][name]}
    let argsFixed = `first: Int, after: String, `
    if(args){
    Object.keys(args).forEach(arg => {
      argsFixed += ` ${arg}: ${args[arg].type.name},`
    });
    argsFixed = argsFixed.substring(0, argsFixed.length - 1)
    fragmentsDefs.push({ type: upperCaseFirstLetter(name), typeOperation: upperCaseFirstLetter(name)+'Connection', args: argsFixed, operation: name, operationAll: name })
    }
  }
});

module.exports = { fragmentsDefs };





