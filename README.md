# resurfaceio-logger-nodejs
Logging usage of Node.js-based services, with user privacy by design.

Visit <a href="https://resurface.io">resurface.io</a> for general information on usage logging.

[![npm version](https://badge.fury.io/js/resurfaceio-logger.svg)](https://badge.fury.io/js/resurfaceio-logger)

## Contents

<ul>
<li><a href="#dependencies">Dependencies</a></li>
<li><a href="#installing_with_npm">Installing With npm</a></li>
<li><a href="#logging_from_express_middleware">Logging From Express Middleware</a></li>
<li><a href="#logging_from_apollo_server_on_express">Logging From Apollo Server on Express</a></li>
<li><a href="#logging_from_express_route">Logging From Specific Express Routes</a></li>
<li><a href="#logging_with_api">Logging With API</a></li>
<li><a href="#privacy">Protecting User Privacy</a></li>
</ul>

<a name="dependencies"/>

## Dependencies

Requires Node.js 10.x or later. No other dependencies to conflict with your app.

<a name="installing_with_npm"/>

## Installing With npm

```
npm install resurfaceio-logger --save
```

<a name="logging_from_express_middleware"/>

## Logging From Express Middleware

After <a href="#installing_with_npm">installing the module</a>, add a `HttpLoggerForExpress` instance to your app, after
any body parsers in use.

```js
const express = require('express');
const app = express();

// add body parsers

const resurfaceio = require('resurfaceio-logger');
resurfaceio.HttpLoggerForExpress.add(app, {
    url: 'https://...', 
    rules: 'include strict'
});

// define routes
```

<a name="logging_from_apollo_server_on_express"/>

## Logging From Apollo Server on Express

After <a href="#installing_with_npm">installing the module</a>, add a `HttpLoggerForExpress` instance before calling `applyMiddleware`.

```js
const app = express();

const resurfaceio = require('resurfaceio-logger');
resurfaceio.HttpLoggerForExpress.add(app, {
    url: 'https://...', 
    rules: 'include strict'
});

const server = new ApolloServer({ ... });

server.applyMiddleware({ app });
```

<a name="logging_from_express_route"/>

## Logging From Specific Express Routes

After <a href="#installing_with_npm">installing the module</a>, create a logger and call it from the routes of interest.

```js
const express = require('express');
const app = express();

const resurfaceio = require('resurfaceio-logger');
const logger = new resurfaceio.HttpLogger({
    url: 'https://...',
    rules: 'include strict'
});

app.get('/', function (request, response) {
    response.render('pages/index', function (e, html) {
        response.status(200).send(html);
        resurfaceio.HttpMessage.send(logger, request, response, html);
    });
});
```

<a name="logging_with_api"/>

## Logging With API

Loggers can be directly integrated into your application using our [API](API.md). This requires the most effort compared with
the options described above, but also offers the greatest flexibility and control.

[API documentation](API.md)

<a name="privacy"/>

## Protecting User Privacy

Loggers always have an active set of <a href="https://resurface.io/rules.html">rules</a> that control what data is logged
and how sensitive data is masked. All of the examples above apply a predefined set of rules (`include strict`),
but logging rules are easily customized to meet the needs of any application.

<a href="https://resurface.io/rules.html">Logging rules documentation</a>

---
<small>&copy; 2016-2020 <a href="https://resurface.io">Resurface Labs Inc.</a></small>
