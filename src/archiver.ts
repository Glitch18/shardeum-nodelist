import { Command } from 'commander';
import axios from 'axios'
import config from '../config.json'
import { getMonitorNodes } from './monitor';

export async function getArchiverNodes() {
    const url = `http://${config.archiver.ip}:${config.archiver.port}/full-nodelist`
	const data = await axios.get(url).then(res => res.data)
	return data
}

export function registerArchiverCommands(program: Command) {
    const archiver = program
        .command('archiver')
        .description('Commands to query archiver nodelist')

    archiver
        .command('count')
        .description('Get total number of active nodes in the archiver')
        .action(async () => {
            const data = await getArchiverNodes()
            console.log(data.nodeList.length)
        })

    archiver
        .command('difference')
        .description('Get active nodes listed by archiver but not by monitor')
        .action(async () => {
            const [monitorNodes, archiverNodes] = await Promise.all([getMonitorNodes(), getArchiverNodes()])
            const archiverIds = archiverNodes.nodeList.map(node => node.id)

            const difference = archiverIds.filter(id => !monitorNodes.nodes.active[id])
            console.log(difference)
            console.log(difference.length)
        })
}