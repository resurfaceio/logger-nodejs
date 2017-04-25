# resurfaceio-logger-nodejs
&copy; 2016-2017 Resurface Labs LLC

This library makes it easy to log actual usage of Node.js apps.

## Installing with npm

    mkdir test
    cd test
    npm init -y
    npm install resurfaceio/resurfaceio-logger-nodejs

## Using API Directly

    const resurfaceio = require('resurfaceio-logger');
    
    // manage all loggers (even those not created yet)
    const UsageLoggers = resurfaceio.UsageLoggers;
    UsageLoggers.disable();                                          // disable all loggers
    UsageLoggers.enable();                                           // enable all loggers
    
    // create and configure logger
    const HttpLogger = resurfaceio.HttpLogger;
    var logger = new HttpLogger({queue: queue});                     // log to appendable list
    logger = new HttpLogger({queue: queue, enabled: false});         // (initially disabled)
    logger = new HttpLogger({url: my_https_url});                    // log to https url
    logger = new HttpLogger({url: my_https_url, enabled: false});    // (initially disabled)
    logger.disable();                                                // enable this logger
    logger.enable();                                                 // disable this logger
    if (logger.enabled) ...                                          // test if this enabled
    
    // submit a custom message (destination may accept or not)
    logger.submit('...');
