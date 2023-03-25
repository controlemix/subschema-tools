const path = require('path');
let typesDir = path.join(__dirname,'../../../../../../src/schema/types/args/' );
require('fs').readdirSync(typesDir ).forEach(function(file) {
  if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'forwardArgs.js') {
    let name = file.replace('.js', '');
    name =  name.split('Args');
    name = name[0]
    exports[name] = {[name]:{...require(typesDir + file)}};
  }
});

