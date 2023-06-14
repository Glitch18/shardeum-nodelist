#!/usr/bin/env node

import { Command } from 'commander';
import { registerArchiverCommands } from './archiver';
import { registerMonitorCommands } from './monitor';
import fs from 'fs'
import axios from 'axios'

const program = new Command();

registerArchiverCommands(program);
registerMonitorCommands(program);

program
    .command('query')
    .argument('<file-name>', 'File name of the list of nodes to query')
    .action(async (fileName) => {
        const nodes = JSON.parse(fs.readFileSync(fileName, 'utf-8'))

        const promises = nodes.map((node: string) => {
            const creds = node.replace(" ", "")
            const [ip, port] = creds.split(":")
            return axios.get(`http://${ip}:${port}/nodeinfo`).then(res => res.data).catch(() => null)
        })

        const data = await Promise.all(promises)

        let active = 0, offline = 0, syncing = 0, standby = 0
        for (const node of data) {
            try{
                if (!node) {
                    offline++
                } else if (node.nodeInfo.status === null) {
                    standby++
                } else if (node.nodeInfo.status === 'active') {
                    active++
                } else if (node.nodeInfo.status === 'syncing') {
                    syncing++
                }
            } catch(e) {
                console.log(node)
                console.log(e)
            }
        }

        console.log('Total nodes:', data.length)
        console.log('Active:', active)
        console.log('Offline:', offline)
        console.log('Syncing:', syncing)
        console.log('Standby:', standby)
    })

program.parse();