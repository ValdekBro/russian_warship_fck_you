const compute = require('@google-cloud/compute');
const { sleep } = require("./helpers");
require('dotenv').config();

const PROJECT_ID = 'todo-7db20'
const REGION = process.env.INSTANCE_REGION
const ZONE = process.env.INSTANCE_ZONE

const addresses = new compute.AddressesClient();
const instances = new compute.InstancesClient();
const operationsClient = new compute.RegionOperationsClient();

const waitForOperation = (task) => new Promise(async (res, rej) => {
    let operation = task
    if (operation.error) {
        console.log(operation.error.errors)
        return rej(operation.error.errors[0])
    }
    // Wait for the create operation to complete.
    while (operation.status !== 'DONE') {
        try {
            const response = await operationsClient.wait({
                operation: operation.name,
                project: PROJECT_ID,
                region: REGION,
            });
            operation = response[0]
            console.log(operation)
            if (operation.error) {
                console.log(operation.error.errors)
                return rej(operation.error.errors[0])
            }
        } catch (e) {
            if (e.code === 5) {
                break
            }
            else {
                console.log(e.errors)
                return rej(e)
            }
        }

    }
    return res(operation)
})

const getAllIPs = async () => {
    const [list] = await addresses.list({
        project: PROJECT_ID,
        region: REGION
    })
    return list
}

const getIP = async (name) => {
    const [address] = await addresses.get({
        project: PROJECT_ID,
        region: REGION,
        address: name
    })

    return address
}

const getCurrentIP = async () => {
    const [instance] = await instances.get({
        project: PROJECT_ID,
        region: REGION,
        zone: ZONE,
        instance: process.env.INSTANCE_NAME
    })

    if (!instance.networkInterfaces[0].accessConfigs[0])
        return null

    const ip = instance.networkInterfaces[0].accessConfigs[0].natIP

    const all = await getAllIPs()

    return all.find(address => address.address == ip)
}

const createNewIP = async () => {
    const name = `${process.env.INSTANCE_NAME}-${(new Date()).getTime()}`
    const [response] = await addresses.insert({
        project: PROJECT_ID,
        region: REGION,
        addressResource: {
            name,
        }
    })

    await waitForOperation(response.latestResponse)

    let newAddress

    while (!newAddress) {
        await sleep(5000)
        try {
            newAddress = await getIP(name)
        } catch (e) {
            console.log(e)
        }
    }

    return newAddress
}

const updateInctanceIP = async (ip) => {
    const deleteOperation = await instances.deleteAccessConfig({
        project: PROJECT_ID,
        region: REGION,
        zone: ZONE,
        instance: process.env.INSTANCE_NAME,
        accessConfig: 'External NAT',
        networkInterface: process.env.INSTANCE_NETWORK_INTERFACE
    })
    console.log(deleteOperation[0].latestResponse)
    await waitForOperation(deleteOperation[0].latestResponse)
    console.log('deleted')
    const updateOperation = await instances.addAccessConfig({
        project: PROJECT_ID,
        region: REGION,
        zone: ZONE,
        instance: process.env.INSTANCE_NAME,
        networkInterface: process.env.INSTANCE_NETWORK_INTERFACE,
        accessConfigResource: {
            name: 'External NAT',
            natIP: ip
        }
    })
    console.log(updateOperation[0].latestResponse)
    await waitForOperation(updateOperation[0].latestResponse)
    console.log('added')
}

const releaseIP = async (name) => {
    const deleteOperation = await addresses.delete({
        project: PROJECT_ID,
        region: REGION,
        address: name
    })
    console.log(deleteOperation[0].latestResponse)
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
