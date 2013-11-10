// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('Dv-pUjLBGTI4IxU3');

var connect = require('connect'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    querystring = require('querystring'),
    handlebars = require('handlebars'),
    request = require('request'),
    zombie = require('zombie'),
    RSVP = require('rsvp');

var isProduction = (process.env.NODE_ENV === 'production'),
    hostname = isProduction ? 'http://ally.2013.nodeknockout.com' : 'http://localhost:8000',
    port = (isProduction ? 80 : 8000);

// TODO: Identify any reasonable options.
var opts = [
  {
    key: "display-none",
    value: "Don't reset display: none;"
  }, {
    key: "visibility-hidden",
    value: "Don't reset visibility: hidden;"
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

function fetch(url) {
  return new RSVP.promise(function(resolve, reject) {
    request(url, function (error, res, body) {
      if (error) reject(error);

      res.body = body;
      resolve(res);
    });
  });
}

function parse(targeturl, options) {

  var browser = new zombie();

  browser.visit(targeturl)
  .fin(function() {
    // FIXME: Stop assuming that the zombie recovers.
  
    // Get the document title.
    var title = browser.text("title");

    // Find every <link rel="stylesheet"> and <style> block, queue them in order.
    var stylesheets = browser.queryAll("link[rel=stylesheet],style");
    
    stylesheets.forEach(function(stylesheet) {

      if (stylesheet.tagName.toLowerCase() == 'link') {
         console.log(stylesheet.href + stylesheet.media);
      } else {
        console.log(stylesheet.innerHTML);
      }
    });
  });


  // TODO: Request all of the CSS that was included remotely.
  // TODO: Parse all of the CSS.
  // TODO: Calculate the CSS needed to negate their CSS, taking into consideration the configuration.
  // TODO: Print the list of options in a comment at the top of the output.
  return "Parsed CSS content.";
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
    var parsed = parse(targeturl, setoptions);

    var title = 'negated page title';

    if (contenttype == 'html') {
      res.statusCode = 200;
      res.setHeader('Set-Cookie', 'previous='+previousURLs.join('~~~'));
      res.setHeader('Content-Type', 'text/'+contenttype);
      res.end(templates.negate({
        title: title,
        url: targeturl,
        thispage: hostname + req.url,
        cssurl: hostname + req.url.replace('parse.html', 'parse.css').replace('&exclude=1', ''),
        output: parsed,
        options: setoptions
      }));
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/css');
      res.end(parsed);
    }
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
