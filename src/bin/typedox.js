#!/usr/bin/env node

const main = require('../backend/index.js').default;
const { loggerUtils } = require('../backend/typedox.js');

loggerUtils.isRequestForHelp() ? loggerUtils.logApplicationHelp() : main();
