// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('Dv-pUjLBGTI4IxU3');

var connect = require('connect'),
    http = require('http');

var app = connect()
  .use(connect.favicon('public/favicon.ico'))
  .use(connect.logger('dev'))
  .use(connect.static('public'))
  .use(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body>Hello from Connect!</body></html>\n');
  });

var isProduction = (process.env.NODE_ENV === 'production');
var port = (isProduction ? 80 : 8000);

http
  .createServer(app)
  .listen(port, function(err) {
    if (err) { console.error(err); process.exit(-1); }

    // if run as root, downgrade to the owner of this file
    if (process.getuid() === 0) {
      require('fs').stat(__filename, function(err, stats) {
        if (err) { return console.error(err); }
        process.setuid(stats.uid);
      });
    }

    console.log('Server running at http://0.0.0.0:' + port + '/');
  });
