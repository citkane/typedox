#!/usr/bin/env node

import main, { Dox } from '../backend/src/typedox.mjs';
Dox.isRequestForHelp() ? Dox.logApplicationHelp() : main();
