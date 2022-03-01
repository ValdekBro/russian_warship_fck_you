const { default: axios } = require("axios")

const PROJECT_ID = 'todo-7db20'
const REGION = 'asia-east2-a'

let accessToken = `ya29.c.b0AXv0zTPVk4Z4b1Vif7CZYy1Pi7H9dU9p5aLjJ8CVUR5Zg0C2fDEEEmIqP0mBq92R4BjmLnYWFPNM2YDkf2aaSLe5obx6WrRB6r9VANmfCBcLajUpG5hAgou0vNfCHt8Xp9HFz3SCaeSbF1AxPKtJIugtoRf8ucxLI0VOu1MedlZcfSZp3LGvTye_DbdDK0KXjhbkQehWDqrhZPl7yXVSWdk`

const updateAccessToken = async () => {
    const response = await axios.get('https://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', { headers: {
        "Metadata-Flavor": "Google"
    }})

    accessToken = response.data.access_token
}

const getAllStaticIP = async () => {
    const response = await axios.get(`https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/regions/${REGION}/addresses`, { headers: {
        "Authorization": `Bearer ${accessToken}`
    }})

    return response.data
}

setInterval(async () => {
    // await updateAccessToken()
    console.log(await getAllStaticIP())
    console.log(accessToken)
}, 10 * 1000) // every 60 seconds