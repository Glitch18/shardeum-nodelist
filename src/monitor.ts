import { Command } from 'commander';
import axios from 'axios'
import config from '../config.json'
import fs from 'fs'
import path from 'path'
import { getArchiverNodes } from './archiver';

let token: string
if (fs.existsSync(path.join(__dirname, '../token'))) {
    token = fs.readFileSync(path.join(__dirname, '../token'), 'utf-8')
}

export async function getMonitorNodes() {
    const url = `http://${config.monitor.ip}:${config.monitor.port}/api/report`
    const res = await axios.get(url, { headers: { Authorization: `${token}` } })
    return res.data
}

async function getAuthKey() {
    const url = `http://${config.monitor.ip}:${config.monitor.port}/api/signin`
    const res = await axios.post(url, { username: config.monitor.username, password: config.monitor.password })
    token = res.data.token
}

export function registerMonitorCommands(program: Command) {
    const monitor = program
        .command('monitor')
        .description('Commands to query monitor')

    monitor
        .command('refresh-key')
        .description('Refresh auth key')
        .action(async () => {
            await getAuthKey()
            fs.writeFileSync(path.join(__dirname, '../token'), token)
        })

    monitor
        .command('count')
        .description('Get total number of active nodes in the monitor')
        .option('-s', 'Save active nodes to file')
        .action(async (options) => {
            const data = await getMonitorNodes()
            if(options.s) {
                fs.writeFileSync(
                    path.join(
                        __dirname,
                        `../active-nodes_${Date.now()}.json`
                    ),
                    JSON.stringify(data.nodes.active))
            }

            console.log(Object.keys(data.nodes.active).length)
        })

    monitor
        .command('difference')
        .description('Get active nodes listed by monitor but not by archiver')
        .action(async () => {
            const [archiverNodes, monitorNodes] = await Promise.all([getArchiverNodes(), getMonitorNodes()])

            // Get active nodes listed by monitor but not by archiver
            const archiverIds = archiverNodes.nodeList.map(x => x.id)
            const difference = Object.keys(monitorNodes.nodes.active).filter(x => !archiverIds.includes(x))
            console.log(difference)
            console.log(difference.length)
        })
}