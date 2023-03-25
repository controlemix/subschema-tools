const { parseSeeds } = require('../schema/utils/schemaParses');
const { generator } = require('../gateway/schemas/seeds/utils/schemaGenerator');
const { fixJoinMonster } = require('./fixes');

const preLoad = (__options) =>
  new Promise(async (resolve, _reject) => {
    const { loadDefinitions, loadGenerator, loadFixes, NODE_ENV } = __options;
    await parseSeeds(loadDefinitions);
    await generator(loadGenerator);
    await fixJoinMonster(loadFixes, NODE_ENV);
    resolve('Preload finished!');
  });

module.exports.preLoad = preLoad;
