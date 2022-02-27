class Endpoint {
    stats = {
        s: 0,
        e: 0,
        lastE: null
    }

    constructor(params, parentLogger) {
        this.url = params.url
        this.type = params.type
        this.body = params.body
        const q = new URL(this.url);
        this._options = {
            path: q.pathname,
            hostname: q.hostname,
            port: q.port,
            method: this.type,
            timeout: 2000,
        };
        this._protocol = (q.protocol == "http") ? require('http') : require('https');
        this.logger = parentLogger.child({ url: this.url })

        this.logger.info(`Endpoint ${this.url} initialized`)
    }

    attack() {
        const r = new Promise((res, rej) => {
            const req = this._protocol.request(
                this._options,
                response => {
                    res({
                        status: response.statusCode,
                        error: response.statusCode >= 300 ? response.statusMessage : 'OK'
                    })

                }
            )
            req.on('error', rej)

            if (this.body)
                req.write(this.body)

            req.on('socket', function (socket) {
                socket.setTimeout(3000);
                socket.on('timeout', function () {
                    req.destroy();
                });
            });

            req.end()
        })
        r.then(result => {
            this.logger.info(`${result.status} | ${result.error}`)
            if (result.status < 400) this.stats.s++
            else this.stats.e++
        }).catch((e) => {
            this.logger.info(`Failed | ${e}`)
            this.stats.e++
        })
    }
}

module.exports = {
    Endpoint,
}