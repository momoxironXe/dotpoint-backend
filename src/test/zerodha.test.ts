import { Request, Response } from "express";
import { flushAllKeys, getRedisKeysWithPartialMatch, getRedisKeysWithPartialMatchData, redis, redisClient, redisPrefix, reqInfo, responseMessage } from "../helper";
import { apiResponse } from "../common";
// import { instrumentModel } from "../database";

const axios = require('axios');

export const get_all_instruments = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://api.kite.trade/instruments',
            headers: {
                'X-Kite-Version': '3',
                'Authorization': 'token rdbkxko9imfvuyfx:Twug9IXQ8172HfePL3BH2162fGUvS5et'
            }
        };

        let response: any = await axios.request(config)
        console.log(response.data.split('\n'));
        return res.status(200).json(await apiResponse(200, responseMessage?.customMessage('Zerodha test successfully done!'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

// export const redis_auto_caching_restore = async () => {
//     try {
//         let niftyArray = [], bankNiftyArray = [], finNiftyArray = []
//         let instrumentConfig = {
//             method: 'get',
//             maxBodyLength: Infinity,
//             url: 'https://api.kite.trade/instruments',
//             headers: {
//                 'X-Kite-Version': '3',
//                 'Authorization': 'token rdbkxko9imfvuyfx:Twug9IXQ8172HfePL3BH2162fGUvS5et'
//             }
//         };

//         let instrumentResponse: any = await axios.request(instrumentConfig)
//         instrumentResponse = instrumentResponse.data.split('\n')
//         const keys = instrumentResponse[0].split(',');
//         instrumentResponse.splice(1, 1)
//         await Promise.all(instrumentResponse.map(async (instrument, i) => {
//             const valuesList = instrumentResponse[i].split(',');
//             const data: any = {};
//             for (let j = 0; j < keys.length; j++) {
//                 data[keys[j]] = String(valuesList[j]);
//                 if (data && data?.name) {
//                     data.name = data.name.replace(/^"(.*)"$/, '$1');
//                 }
//             }
//             if (data?.name === 'NIFTY') {
//                 niftyArray.push(data);
//                 await redisClient.set(`${data?.tradingsymbol}`, JSON.stringify(data))
//             }
//             if (data?.name === 'BANKNIFTY') {
//                 bankNiftyArray.push(data);
//                 await redisClient.set(`${data?.tradingsymbol}`, JSON.stringify(data))
//             }
//             if (data?.name === 'FINNIFTY') {
//                 finNiftyArray.push(data);
//                 await redisClient.set(`${data?.tradingsymbol}`, JSON.stringify(data))
//             }
//             console.log(i);
//         }))
//         await Promise.all([
//             instrumentModel.insertMany(niftyArray),
//             instrumentModel.insertMany(finNiftyArray),
//             instrumentModel.insertMany(bankNiftyArray),
//         ])
//         return { niftyArray, bankNiftyArray, finNiftyArray };
//     } catch (error) {
//         console.log(error)
//         throw new Error(error)
//     }
// }

(async () => {
    const partialMatchPattern = '*NIFTY*'; // Replace with your desired pattern
    // await flushAllKeys()
    // console.log(await getRedisKeysWithPartialMatchData(partialMatchPattern));

    // let { niftyArray, bankNiftyArray, finNiftyArray } = await redis_auto_caching_restore()
    // console.log("DONE");
    // await redisClient.set(`${redisPrefix?.bank_nifty_instrument}`, JSON.stringify(bankNiftyArray))
    // await redisClient.set(`${redisPrefix?.nifty_instrument}`, JSON.stringify(niftyArray))
    // await redisClient.set(`${redisPrefix?.fin_nifty_instrument}`, JSON.stringify(finNiftyArray))
    // let [niftyArray, bankNiftyArray, finNiftyArray] = await Promise.all([
    //     redisClient.get(`${redisPrefix?.bank_nifty_instrument}`),
    //     redisClient.get(`${redisPrefix?.nifty_instrument}`),
    //     redisClient.get(`${redisPrefix?.fin_nifty_instrument}`),
    // ])
    // niftyArray = JSON.parse(niftyArray)
    // bankNiftyArray = JSON.parse(bankNiftyArray)
    // finNiftyArray = JSON.parse(finNiftyArray)
    // console.log(niftyArray);
    // console.log(bankNiftyArray?.length);
    // console.log(finNiftyArray?.length);
})()