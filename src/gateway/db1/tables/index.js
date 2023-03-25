
const path = require('path');
const getseedTables = () => {
  const seedTables = [];
  require('fs')
  .readdirSync(path.join(__dirname, `../../../../../../config/seeds/`))
  .forEach(function(file) {
    if (file.match(/\.yaml$/) !== null && file !== 'index.js') {
      seedTables.push(file);
    }
  });
  return { seedTables }
}
module.exports = {  getseedTables };

