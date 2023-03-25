const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const voyagerMiddleware = require('graphql-voyager/middleware').express;
const redirect = require("express-redirect");

async function applyMiddlewareApp(app, ENVIRONMENTS, express) {
  const { NODE_ENV, GRAPHQL_PATH } = ENVIRONMENTS;
  // const corsOptions = {
  //   "origin": "*",
  //   "methods": "GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS",
  //   "preflightContinue": false,
  //   "optionsSuccessStatus": 204
  // };  
  const corsOptions = {"origin": "*" };  
  app.use(cors(corsOptions));

  const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 100, 
    max: 50000, 
    message: 'Too many requests from this IP, please try again after 2 minutes',
  });

  app.use(apiLimiter);

  app.use(xss());
  app.disable('x-powered-by');

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use('/api/voyager', voyagerMiddleware({ endpointUrl: GRAPHQL_PATH }));

  app.get('/api/reconnect', function(req, res) {
    let { token } = req.query;
    if (token == 'underlinux') {
      require('../../utils/actionsHandles').tx2?.emit?.('RESTART_APP', NODE_ENV);
    }
    res.end('Send signal for restart...');
  });

  app.use('/api/docs/images', express.static('./public/images'));

  app.get('/api/docs', function(_req, res) {
    let stream = require('fs').createReadStream('./public/index.html');
    stream.pipe(res);
  });

  app.get('/api/logs/**', function(req, res) {
    let typeLog = req.url.replace('/api/logs/', '') + '.log';
    let staticBasePath = 'logs/';
    let fileLoc = '';
    let stream = undefined;
    if (typeLog == 'out.log') {
      fileLoc = path.resolve(staticBasePath);
      fileLoc = path.join(fileLoc, 'out.log');
      stream = require('fs').createReadStream(fileLoc);
      stream.pipe(res);
    } else if (typeLog == 'error.log') {
      staticBasePath = 'logs/errors/';
      fileLoc = path.resolve(staticBasePath);
      fileLoc = path.join(fileLoc, 'error.log');
      stream = require('fs').createReadStream(fileLoc);
      stream.pipe(res);
    }
  });

  redirect(app);
  app.redirect("/gql/**/api/monitor", "/api/monitor", 301);
  app.redirect("/gql/**/api/docs", "/api/docs", 301);
  app.redirect("/gql/**/api/logs/out", "/api/logs/out", 301);
  app.redirect("/gql/**/api/logs/error", "/api/logs/error", 301);
  app.redirect("/gql/**/api/voyager", "/api/voyager", 301);
  app.redirect("/gql/**/api/reconnect", "/api/reconnect", 301);
  app.redirect("/gql/**/graphql", "/graphql", 301);

}

module.exports.applyMiddlewareApp = applyMiddlewareApp;
