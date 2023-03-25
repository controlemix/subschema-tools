const { lowerCaseFirstLetter } = require('../utils/constantsFn');

function listPreTypesAdapt(staticBasePath) {
   require('fs')
    .readdirSync(staticBasePath)
    .forEach(function(file) {
      if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'types.js') {
        let name = file.replace('.js', '');
        exports[lowerCaseFirstLetter(name)] = require(staticBasePath + file)[name + 'Adapt'];
      }
    });
}

function listPosTypesAdapt(staticBasePath) {
  let types = {};
   require('fs')
    .readdirSync(staticBasePath)
    .forEach(function(file) {
      if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'types.js') {
        const name = file.replace('.js', '');
        types = { ...types, [`${name}`]: require(staticBasePath + file)[name + 'Adapt'] };
      }
    });
    return types;
}

function listTypesForUnion(staticBasePath) {
  let types = ''
  require('fs').readdirSync(staticBasePath).forEach(function(file) {
    if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'types.js') {
      const name = file.replace('.js', '');
      types += ` ${name} |`;
    }
  });
  return types.slice(0, -1);
}

module.exports = {
    listPreTypesAdapt,
    listPosTypesAdapt,
    listTypesForUnion
};