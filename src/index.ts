"use strict"
/**
 * @author Mukund Khunt
 * @description Server and REST API config
 */
import * as bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import cors from 'cors'
import * as packageInfo from '../package.json'
import { router } from './routes'
import os from 'os'
import { daily_10_minutes_cron_job, daily_12_PM_cron_job, every_3_minutes_cron_job, socketServer } from './helper';
const app = express();
global.osName = os.platform()
global.accountIdList = []
global.intervalList = {}
global.metaAccount = {}
global.intervalList[`tradingAccountInterval`] = []
global.intervalList[`accountStopLossInterval`] = []

if (process.env.NODE_ENV === 'production') {
    daily_10_minutes_cron_job.start()
    daily_12_PM_cron_job.start()
    every_3_minutes_cron_job.start()
}
function rawBody(req, res, next) {
    req.setEncoding('utf8');

    var data = '';

    req.on('data', function (chunk) {
        data += chunk;
    });

    req.on('end', function () {
        req.rawBody = data;

        next();
    });
}

app.use(cors())
app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))
app.use('/images', express.static(process.cwd() + '/images'))

const health = (req, res) => {
    return res.status(200).json({
        message: `Dot Point App ${process.env.NODE_ENV?.charAt(0)?.toUpperCase() + process.env.NODE_ENV?.slice(1)} Node.js (18.x) Server is Running, Server health is green`,
        app: packageInfo.name,
        version: packageInfo.version,
        description: packageInfo.description,
        author: packageInfo.author,
        license: packageInfo.license,
        homepage: packageInfo.homepage,
        repository: packageInfo.repository,
        contributors: packageInfo.contributors
    })
}

const bad_gateway = (req, res) => { return res.status(502).json({ status: 502, message: "Dot Point App Backend API Bad Gateway" }) }

app.get('/', health);
app.get('/health', health);
app.get('/isServerUp', (req, res) => {
    res.send('Server is running ');
});
// app.use((req: any, res, next) => {
//     req.setEncoding('utf8');

//     var data = '';

//     req.on('data', function (chunk) {
//         data += chunk;
//     });

//     req.on('end', function () {
//         req.rawBody = data;

//         next();
//     });
// })
app.use(router)
app.use('*', bad_gateway);

export default socketServer(app);
