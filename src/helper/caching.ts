import NodeCache from "node-cache"
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

export const setCache = async (key: any, data: any, time?: any) => {
    return await myCache.set(`${key}`, data, time || 1800)
}

export const deleteCache = async (key: any) => {
    let get_data: any = await myCache.del(key)
    if (get_data) return true
    else return false
}

export const getCache = async (key: any) => {
    let get_data: any = await myCache.get(key)
    if (get_data) return get_data
    else return false
}

export const cacheValueByKeySearch = async (keySearch: string) => {
    let allKeyName = myCache.keys(), keyArray: Array<string> = []
    await allKeyName.map(data => {
        if (data.includes(keySearch)) keyArray.push(data)
    })
    return keyArray
}   