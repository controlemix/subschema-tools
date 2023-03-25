const { lowerCaseFirstLetter } = require('../../utils/constantsFn');
const path = require('path');
let typesDir = path.join(__dirname,'../../../../../src/schema/types' + '/');
require('fs')
  .readdirSync(typesDir )
  .forEach(function(file) {
    if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'types.js') {
      let name = file.replace('.js', '');
      exports[lowerCaseFirstLetter(name)] = require(typesDir + file)[name + 'Adapt'];
    }
  });
