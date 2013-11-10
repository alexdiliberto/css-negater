// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('Dv-pUjLBGTI4IxU3');

var connect = require('connect'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    url = require('url'),
    querystring = require('querystring'),
    handlebars = require('handlebars'),
    request = require('request'),
    zombie = require('zombie'),
    css = require('css'),
    RSVP = require('rsvp');

var isProduction = (process.env.NODE_ENV === 'production'),
    hostname = isProduction ? 'http://ally.2013.nodeknockout.com' : 'http://localhost:8000',
    port = (isProduction ? 80 : 8000);

var opts = [
  {
    key: "display-none",
    value: "Don't reset 'display: none;'"
  }, {
    key: "visibility-hidden",
    value: "Don't reset 'visibility: hidden;'"
  }
];

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

function parse(targeturl, options) {

  var browser = new zombie();

  var load = new RSVP.Promise(function(resolve, reject) {
    // FIXME: Stop assuming that the zombie recovers.
    browser.visit(targeturl).fin(function() {
      resolve({
        targeturl: targeturl,
        options: options,
        browser: browser
      });
    })
  });

  return load.then(function(previous) {

    var options = previous.options;
    var browser = previous.browser;

    // Find every <link rel="stylesheet"> and <style> block, keep them in order.
    var stylesheets = browser.queryAll("link[rel=stylesheet],style");
    
    // Turn all of the stylesheets into promises.
    stylesheets = stylesheets.map(function(stylesheet) {
      var result = {};
      if (stylesheet.tagName.toLowerCase() == 'link') {
        // Request all of the CSS that was included remotely.
        return new RSVP.Promise(function(resolve, reject) {
          request(url.resolve(browser.location.href, stylesheet.href), function (error, res, body) {
            if (error) { reject(error); }

            result.media = !!stylesheet.media ? stylesheet.media : undefined;
            result.body = body;
            resolve(result);
          });
        });
      } else {
        // Snag all of the CSS that was included locally, wrpa it in a promise for safekeeping.
        return new RSVP.Promise(function(resolve, reject) {
          result.media = undefined;
          result.body = stylesheet.innerHTML;
          resolve(result);
        })
      }
    });

    return RSVP.hash({
      targeturl: previous.targeturl,
      options: previous.options,
      title: browser.text('title'),
      stylesheets: RSVP.all(stylesheets)
    });
  }).then(function(previous) {
    var options = previous.options;
    var stylesheets = previous.stylesheets;

    var preamble = "";
    var parsedcss = "";

    if (options.length) {
      var keyOptions = options.map(function(elem) { return elem.key; });
      var englishOptions = options.map(function(elem) { return elem.value; });
    }

    preamble =  "/*\r\n";
    preamble += "URL: " + previous.targeturl;
    if (options.length) preamble += "\r\n\r\nOptions:\r\n- " + englishOptions.join("\r\n- ");
    preamble += "\r\n*/\r\n";

    stylesheets.forEach(function(stylesheet) {
      var interim = css.parse(stylesheet.body);
      interim.stylesheet.rules = interim.stylesheet.rules.map(function(rule) {
        rule.declarations = rule.declarations.map(function(declaration) {
          // TODO: Calculate the CSS needed to negate their CSS, taking into consideration the options.
          declaration.value = "inherit";
          return declaration;
        });
        return rule;
      });

      parsedcss += css.stringify(interim, { compress: true })+"\r\n";
    });

    return RSVP.hash({
      targeturl: previous.targeturl,
      title: previous.title,
      options: previous.options,
      parsedcss: preamble + parsedcss
    });
  });
}

function parseBitmask(options) {
  var setOpts = [];

  if (!options) return undefined;

  for (var i = opts.length-1; i >= 0; i--) {
    if(bitTest(options, i)) {
      setOpts.push(opts[opts.length-1-i]);
    }
  }

  return setOpts;
}

function bitTest(num, bit) {
  return ((num>>bit) % 2 !== 0);
}

// Define your routes as members of the routes object.
var routes = {
  "parse": function(req, res, next) {
    var targeturl = req.query.url || undefined;
    var contenttype = req.acceptType || "html";
    var options = req.query.options || undefined;

    if (contenttype !== "html" && contenttype !== "css") { return next(); }

    // http://docs.jquery.com/Plugins/Validation/Methods/url
    // From Scott Gonzalez: http://projects.scottsplayground.com/iri/
    if (!/^(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(targeturl)) {
      routes["400"](req, res, next);
      return;
    }

    // Handle previously submitted URLs.
    var previousURLs = [];
    if (req.cookies.previous) {
      previousURLs = req.cookies.previous.split('~~~');
      previousURLs = previousURLs.map(function(elem) { return querystring.escape(elem); });
    }

    // Only unshift this request if it isn't being repopulated.
    if (req.query.exclude !== '1') {
      previousURLs.unshift(querystring.escape(req.url));
      previousURLs = previousURLs.filter(function (value, index, self) { return self.indexOf(value) === index; });
    }

    var setoptions = parseBitmask(options);

    // Set scope.
    var callback = (function() {
      return function(results) {
        if (contenttype == 'html') {
          res.statusCode = 200;
          res.setHeader('Set-Cookie', 'previous='+previousURLs.join('~~~'));
          res.setHeader('Content-Type', 'text/'+contenttype);
          res.end(templates.negate({
            title: results.title,
            url: targeturl,
            thispage: hostname + req.url,
            cssurl: hostname + req.url.replace('parse.html', 'parse.css').replace('&exclude=1', ''),
            output: results.parsedcss,
            options: results.options
          }));
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/css');
          res.end(results.parsedcss);
        }
      }
    })();

    parse(targeturl, setoptions).then(callback);

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

  // Process the extension.
  .use(function(req, res, next) {
    var extension = connect.utils.parseUrl(req).pathname.match(/\.([^.]+)$/);
    if (extension && extension[1]) {
      req.acceptType = extension[1];
    }
    return next();
  })

  // Process the querystring and cookies.
  .use(connect.query())
  .use(connect.cookieParser())

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
