#!/usr/bin/env node

const main = require('../backend/src/index.js').default;
const { loggerUtils } = require('../backend/src/typedox.js');

loggerUtils.isRequestForHelp() ? loggerUtils.logApplicationHelp() : main();
