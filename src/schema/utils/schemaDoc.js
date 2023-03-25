
const docsGenerator = (schema, NODE_ENV, url, SERVICE_NAME) => {
  return new Promise(async (resolve, reject) => {
    const clc = require('cli-color');
    const { writeFile, readFile } = require('./schemaFsSync');
    const sdl = require('@graphql-tools/utils').printSchemaWithDirectives(schema);
    const isShell = NODE_ENV !== 'test' ? true : false;

    const command = ' -f ./public/index.html';
    if (NODE_ENV !== 'test') {
      require('child_process').spawnSync("rm  " + command, { shell: !isShell });
    }

    const pathGraph = 'src/schema/gql/schema.graphql';
    const args = 'config.yml --one-file';
    const pathAssets = 'public/images/';
    const pathConfig = 'config.yml';

    const config = `
spectaql:
  logoFile: ${pathAssets}logo.png
  faviconFile: ${pathAssets}favicon.png
  displayAllServers: true

introspection:
  removeTrailingPeriodFromDescriptions: true
  schemaFile: ${pathGraph}
  fieldExpansionDepth: 10
  spectaqlDirective:
    enable: false
extensions:
  graphqlScalarExamples: true
info:
  title: ${SERVICE_NAME} Service - Apollo GraphQL
  description: Documentação de Referência da API Subgraph
  x-introItems:
    - title: Utilize o postman para testar os endpoints
servers:
  - url: ${url}
    description: ${NODE_ENV}`;

    await writeFile(pathConfig, config);
    await writeFile(pathGraph, sdl);
    
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);
    
    if (NODE_ENV !== 'test') {
      console.log(clc.magentaBright('generating docs, working please await...'));
      try {
        await exec(`npx spectaql config.yml --one-file`);    
        console.log(clc.magentaBright('generating done!'));
        console.log('');    
      } catch (error) {
        resolve(false)    
      }

      try {
        const fileIndex = await readFile('./public/index.html', 'utf8');
        const dataIndex = fileIndex
          .replace('src="images/logo.png"', 'src="docs/images/logo.png"')
          .replace('href="images/favicon.png"', 'href="docs/images/favicon.png"');
        await writeFile('./public/index.html', dataIndex, 'utf8');        
      } catch (error) {
        resolve(false)
      }

    }
    resolve(true)
  })
}
module.exports.docsGenerator = docsGenerator;
