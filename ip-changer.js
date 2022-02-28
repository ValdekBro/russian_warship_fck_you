const { default: axios } = require("axios")

let accessToken

const updateAccessToken = async () => {
    const response = await axios.get('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', { headers: {
        "Metadata-Flavor": "Google"
    }})

    accessToken = response.data.access_token
}

setInterval(async () => {
    await updateAccessToken()
    console.log(accessToken)
}, 10 * 1000) // every 60 seconds