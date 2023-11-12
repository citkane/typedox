#!/usr/bin/env node

import { config } from '@typedox/core';
import main, { isRequestForHelp, logApplicationHelp } from 'typedox';
isRequestForHelp() ? logApplicationHelp() : main();
