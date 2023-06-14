import { Command } from 'commander';
import axios from 'axios'
import config from '../config.json'
import { getMonitorNodes } from './monitor';

export async function getArchiverNodes() {
    const url = `http://${config.archiver.ip}:${config.archiver.port}/full-nodelist?activeOnly=true`
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
    
    archiver
        .command('search-syncing')
        .description('Search missing nodes in monitor syncing list')
        .action(async () => {
            const [monitorNodes, archiverNodes] = await Promise.all([getMonitorNodes(), getArchiverNodes()])
            const archiverIds = archiverNodes.nodeList.map(node => node.id)

            const difference = archiverIds.filter(id => !monitorNodes.nodes.active[id])
            console.log(`Total missing nodes: ${difference.length}`)
            const found = difference.filter(id => monitorNodes.nodes.syncing[id])
            console.log(found)
            console.log(found.length)
        })

    archiver
        .command('query-difference')
        .description('Query status of nodes missing in monitor active list but present in archiver')
        .action(async () => {
            const [monitorNodes, archiverNodes] = await Promise.all([getMonitorNodes(), getArchiverNodes()])
            const difference = archiverNodes.nodeList.filter(node => !monitorNodes.nodes.active[node.id])

            let standby = 0, syncing = 0, offline = 0

            const nodeInfoPromises = difference.map(node => axios
                .get(`http://${node.ip}:${node.port}/nodeinfo`)
                .then(res => res.data)
                .catch(() => null)
            )
            const nodeInfoResponses = await Promise.all(nodeInfoPromises)

            for (const node of nodeInfoResponses) {
                try{
                    if (!node) {
                        offline++
                    } else if (node.nodeInfo.status === null) {
                        standby++
                    }
                } catch(e) {
                    console.log(node)
                    console.log(e)
                }
            }

            console.log(`Total missing nodes: ${difference.length}`)
            console.log(`Standby: ${standby}`)
            console.log(`Syncing: ${syncing}`)
            console.log(`Offline: ${offline}`)
        })

}