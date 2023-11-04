#!/usr/bin/env node

import main, { isRequestForHelp, logApplicationHelp } from 'typedox';
isRequestForHelp() ? logApplicationHelp() : main();
