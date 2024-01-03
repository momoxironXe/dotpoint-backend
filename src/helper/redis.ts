import { createClient } from 'redis'
import config from 'config'
import Redis from 'ioredis'
import { indexesToJSON } from '../common';
import { logger } from './winston_logger';

const redis_url = config.get('redis_url')
export const redis = new Redis(redis_url);
export const redisClient = createClient({
    url: redis_url as string,
})
export const redisPrefix = {
    cc_avenue_transaction: "cc_avenue_transaction",
    bank_nifty_instrument: "bank_nifty_instrument",
    nifty_instrument: "nifty_instrument",
    fin_nifty_instrument: "fin_nifty_instrument",
};
(async () => {
    redisClient.on("error", (error) => console.error(`Socket Error : ${error}`));
    await redisClient.connect().then(data => console.log('Redis successfully connected!'))
})();

export const getRedisKeysWithPartialMatch = async (pattern) => {
    return new Promise(async (resolve, reject) => {
        try {
            let cursor = '0';
            const keys = [];
            do {
                const [newCursor, matchingKeys] = await redis.scan(cursor, 'MATCH', pattern);
                cursor = newCursor;
                keys.push(...matchingKeys);
            } while (cursor !== '0');
            resolve({ error: false, data: keys });
        } catch (error) {
            console.log(error);
            resolve({ error: true, message: error })
        }
    })
}

export const getRedisKeysWithPartialMatchData = async (pattern) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response: any = await getRedisKeysWithPartialMatch(pattern)
            if (response?.error) {
                resolve({ error: true, message: response?.message })
            }
            let keysData: any = await redis.mget(response?.data)
            if (keysData?.length > 0)
                keysData = indexesToJSON(keysData)
            resolve({ error: false, data: keysData });
        } catch (error) {
            console.log(error);
            resolve({ error: false, message: error })
        }
    })
}

export const flushAllKeys = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            await redis.flushall()
            logger.debug('All Redis keys removed.')
            resolve({ error: false, data: {} });
        } catch (error) {
            console.log(error);
            resolve({ error: false, message: error })
        }
    })

}