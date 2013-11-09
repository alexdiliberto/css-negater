// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('Dv-pUjLBGTI4IxU3');

var connect = require('connect'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    handlebars = require('handlebars');

var isProduction = (process.env.NODE_ENV === 'production'),
    port = (isProduction ? 80 : 8000);

// Template handling using ES6 proxies for a magic-method-alike approach.
var templates = (function() {
  var templatepath = path.join(__dirname,'public','templates');
  var cache = {};

  return Proxy.create({
    get: function(proxy, template) {
      // Only cache templates in production.
      if (isProduction && cache[template]) return cache[template];

      var templatecontents = fs.existsSync(path.join(templatepath,template+'.hbs')) ?
        fs.readFileSync(path.join(templatepath,template+'.hbs'), 'utf8') : "Error";

      cache[template] = handlebars.compile(templatecontents);
      return cache[template];
    }
  });
})();

// REAL CODE GOES HERE

// TODO: Make this load the URL, grab all CSS, parse it, take into consideration configuration, and return the output.
function parse(url, options) {
  return "Parsed CSS content. Options= " + options;
}

// Define your routes as members of the routes object.
var routes = {
  "parse": function(req, res, next) {
    var url = req.query.url || undefined;
    var contenttype = req.acceptType || "html";
    var options = req.query.options || undefined;

    if (contenttype !== "html" && contenttype !== "css") { return next(); }

    // http://docs.jquery.com/Plugins/Validation/Methods/url
    // From Scott Gonzalez: http://projects.scottsplayground.com/iri/
    if (!/^(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)) {
      routes["400"](req, res, next);
      return;
    }

    // TODO: Implement bitmasking for options.
    // var options = parseBitmask(req.query.options);

    res.writeHead(200, {'Content-Type': 'text/html'});
    var parsed = parse(url, options);

    // TODO: Include options mapped over their information in this.
    res.end(templates.negate({url: url, output: parsed}));
  },
  "400": function(req, res, next) {
    fs.readFile(path.join(__dirname,'public','400.html'), function (err, html) {
      res.writeHead(400, {'Content-Type': 'text/html'});
      res.end(html);
    });
  },
  "404": function(req, res, next) {
    fs.readFile(path.join(__dirname,'public','404.html'), function (err, html) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end(html);
    });
  }
};

// Connect's boilerplate.
var app = connect()
  .use(connect.favicon(path.join(__dirname,'public','favicon.ico')))
  .use(connect.logger('dev'))
  .use(connect.static(path.join(__dirname,'public')))

  // Process the querystring.
  .use(connect.query())

  // Process the extension.
  .use(function(req, res, next) {
    var extension = connect.utils.parseUrl(req).pathname.match(/\.([^.]+)$/);
    if (extension && extension[1]) {
      req.acceptType = extension[1];
    }
    return next();
  })

  // Lookup the route.
  .use(function(req, res, next) {
    var route = connect.utils.parseUrl(req).pathname.substring(1).replace(/\.[^.]+$/,'');

    if (routes[route]) {
      routes[route](req, res, next);
    // When all else fails, 404
    } else {
      return next();
    }
  })

  // When all else fails, 404
  .use(function(req, res, next) {
    routes["404"](req, res, next);
  });

// HTTP Server boilerplate.
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
