const compute = require('@google-cloud/compute');
const { sleep } = require("./helpers");
require('dotenv').config();

const PROJECT_ID = 'todo-7db20'
const REGION = process.env.INSTANCE_REGION
const ZONE = process.env.INSTANCE_ZONE

const addresses = new compute.AddressesClient();
const instances = new compute.InstancesClient();

const waitForOperation = (task) => new Promise(async (res, rej) => {
    let operation = task
    if (operation.error) {
        console.log(operation.error.errors)
        return rej(operation.error.errors[0])
    }

    const client = task.zone ? (new compute.ZoneOperationsClient()) : (new compute.RegionOperationsClient())

    // Wait for the create operation to complete.
    while (operation.status !== 'DONE') {
        try {
            const response = await client.wait({
                operation: operation.name,
                project: PROJECT_ID,
                zone: ZONE,
                region: REGION,
            });
            operation = response[0]
            if (operation.error) {
                console.log(operation.error.errors)
                return rej(operation.error.errors[0])
            }
        } catch (e) {
            console.log(e)
            return rej(e)
        }

    }
    return res(operation)
})

const getAllIPs = async () => {
    const [list] = await addresses.list({
        project: PROJECT_ID,
        zone: ZONE,
        region: REGION
    })
    return list
}

const getIP = async (name) => {
    const [address] = await addresses.get({
        project: PROJECT_ID,
        zone: ZONE,
        region: REGION,
        address: name
    })

    return address
}

const getInstanceAccessConfigs = async () => {
    const [instance] = await instances.get({
        project: PROJECT_ID,
        zone: ZONE,
        region: REGION,
        instance: process.env.INSTANCE_NAME
    })

    return instance.networkInterfaces[0].accessConfigs
}

const getCurrentIP = async () => {
    const configs = await getInstanceAccessConfigs()

    const ip = (configs.find(conf => conf.name === 'External NAT')).natIP

    const all = await getAllIPs()

    return all.find(address => address.address == ip)
}

const createNewIP = async (isReserve = false) => {
    const name = `${process.env.INSTANCE_NAME}-${isReserve ? 'reserve' : (new Date()).getTime()}`
    const [response] = await addresses.insert({
        project: PROJECT_ID,
        region: REGION,
        addressResource: {
            name,
        }
    })
    await waitForOperation(response.latestResponse)

    let newAddress = await getIP(name)

    return newAddress
}

const updateInctanceIP = async (ip) => {
    const deleteOperation = await instances.deleteAccessConfig({
        project: PROJECT_ID,
        zone: ZONE,
        instance: process.env.INSTANCE_NAME,
        networkInterface: process.env.INSTANCE_NETWORK_INTERFACE,
        accessConfig: 'External NAT',
    })

    await waitForOperation(deleteOperation[0].latestResponse)
    console.log('IP ADDRESS UNASIGNED: ' + ip)

    const updateOperation = await instances.addAccessConfig({
        project: PROJECT_ID,
        zone: ZONE,
        instance: process.env.INSTANCE_NAME,
        networkInterface: process.env.INSTANCE_NETWORK_INTERFACE,
        accessConfigResource: {
            name: 'External NAT',
            natIP: ip
        }
    })
    await waitForOperation(updateOperation[0].latestResponse)
}

const releaseIP = async (name) => {
    const deleteOperation = await addresses.delete({
        project: PROJECT_ID,
        region: REGION,
        address: name
    })
    await waitForOperation(deleteOperation[0].latestResponse)
    console.log('deleted')
}

const main = async () => {
    let current = await getCurrentIP()
    if (!current)
        throw new Error('Current IP not found')

    while(true) {
        console.log(`\nCURRENT IP ADDRESS: ${current.address}(${current.name})`)

        const created = await createNewIP()
        console.log(`CREATED NEW IP ADDRESS: ${created.address}(${created.name})`)

        await updateInctanceIP(created.address)
        console.log(`'${process.env.INSTANCE_NAME}' IP ADDRESS WAS UPDATED TO: ${created.address}(${created.name}) `)

        await releaseIP(current.name)
        console.log(`IP ADDRESS ${current.address}(${current.name}) RELEASED`)

        current = created

        await sleep(10 * 1000) // cooldown 10 sec
    }
}
main()
