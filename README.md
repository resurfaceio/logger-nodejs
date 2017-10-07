# resurfaceio-logger-nodejs
&copy; 2016-2017 Resurface Labs LLC

This library makes it easy to log actual usage of Node.js apps.

## Contents

<ul>
<li><a href="#dependencies">Dependencies</a></li>
<li><a href="#installing_with_npm">Installing With npm</a></li>
<li><a href="#logging_from_express_route">Logging From Express Route</a></li>
<li><a href="#logging_from_express_middleware">Logging From Express Middleware</a></li>
<li><a href="#advanced_topics">Advanced Topics</a><ul>
<li><a href="#setting_default_url">Setting Default URL</a></li>
<li><a href="#enabling_and_disabling">Enabling and Disabling Loggers</a></li>
<li><a href="#logging_api">Logging API</a></li>
</ul></li>
</ul>

<a name="dependencies"/>

## Dependencies

Requires Node.js 6.10.x or later. The only runtime dependency is `valid-url` (https://github.com/ogt/valid-url).

<a name="installing_with_npm"/>

## Installing With npm

```js
npm install resurfaceio-logger --save
```

<a name="logging_from_express_route"/>

## Logging From Express Route

After <a href="#installing_with_npm">installing the module</a>, create a logger and call it from the routes of interest.

```js
const resurfaceio = require('resurfaceio-logger');
const HttpLogger = resurfaceio.HttpLogger;
const logger = new HttpLogger({url: 'https://my-logging-url'});

app.get('/', function (request, response) {
    response.render('pages/index', function (err, html) {
        response.status(200).send(html);
        logger.log(request, undefined, response, html);
    });
});
```

<a name="logging_from_express_middleware"/>

## Logging From Express Middleware

After <a href="#installing_with_npm">installing the module</a>, ...

<a name="advanced_topics"/>

## Advanced Topics

<a name="setting_default_url"/>

### Setting Default URL

Set the `USAGE_LOGGERS_URL` environment variable to provide a default value whenever the URL is not specified.

```js
// from command line
export USAGE_LOGGERS_URL="https://my-logging-url"

// for Heroku cli
heroku config:set USAGE_LOGGERS_URL=https://my-logging-url
```

Loggers look for this environment variable when no URL is provided.

```js
// for basic logger
var logger = new HttpLogger();
```

<a name="enabling_and_disabling"/>

### Enabling and Disabling Loggers

Individual loggers can be controlled through their `enable` and `disable` methods. When disabled, loggers will
not send any logging data, and the result returned by the `log` method will always be true (success).

All loggers for an application can be enabled or disabled at once with the `UsageLoggers` class. This even controls
loggers that have not yet been created by the application.

```js
UsageLoggers.disable();    // disable all loggers
UsageLoggers.enable();     // enable all loggers
```

All loggers can be permanently disabled with the `USAGE_LOGGERS_DISABLE` environment variable. When set to true,
loggers will never become enabled, even if `UsageLoggers.enable()` is called by the application. This is primarily 
done by automated tests to disable all logging even if other control logic exists. 

```js
// from command line
export USAGE_LOGGERS_DISABLE="true"

// for Heroku app
heroku config:set USAGE_LOGGERS_DISABLE=true
```

<a name="logging_api"/>

### Logging API

Loggers can be directly integrated into your application with this API, which gives complete control over how
usage logging is implemented.

```js
const resurfaceio = require('resurfaceio-logger');
const HttpLogger = resurfaceio.HttpLogger;

// create and configure logger
const logger = new HttpLogger(my_https_url);                   // log to remote url
logger = new HttpLogger({url: my_https_url, enabled: false});  // (initially disabled)
logger = new HttpLogger({queue: queue});                       // log to appendable list
logger = new HttpLogger({queue: queue, enabled: false});       // (initially disabled)
logger.disable();                                              // enable this logger
logger.enable();                                               // disable this logger
if (logger.enabled) ...                                        // test if this enabled

// define request to log
const request = new HttpServletRequestImpl();
request.addHeader('A', '123');
request.method = 'GET';
request.url = 'http://google.com';

// define response to log
const response = new HttpServletResponseImpl();
response.addHeader('B', '234');
response.statusCode = 200;

// log objects defined above
logger.log(request, undefined, response, undefined);

// log with specified request/response bodies
logger.log(request, 'my-request-body', response, 'my-response-body');

// submit a custom message (destination may accept or not)
logger.submit('...').then(console.log('Submitted');
```
