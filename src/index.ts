#!/usr/bin/env node

import { Command } from 'commander';
import { registerArchiverCommands } from './archiver';
import { registerMonitorCommands } from './monitor';

const program = new Command();

registerArchiverCommands(program);
registerMonitorCommands(program);

program.parse();