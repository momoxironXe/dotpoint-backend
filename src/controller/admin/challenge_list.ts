"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeListModel, currencyListModel } from '../../database'
import { apiResponse } from '../../common'

const ObjectId = Types.ObjectId

export const add_challenge_list = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        user: any = req.header('user')
    body.createdBy = user?._id
    body.workspaceId = user?.workspaceId
    body.tradingCurrency = body.tradingCurrency.map((el: any) => {
        return {
            ...el,
            buyChallengeCurrency: el.buyChallengeCurrency.map((curr: any) => {
                if (curr.currency == "EUR") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050311910.png",
                        currencySymbol: "€"
                    }
                } else if (curr.currency == "USD") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703051713960.jpg",
                        currencySymbol: "$"
                    }
                } else if (curr.currency == "CNY") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050323030.png",
                        currencySymbol: "CN¥"
                    }
                } else if (curr.currency == "HKD") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050272674.png",
                        currencySymbol: "HK$"
                    }
                } else if (curr.currency == "TWD") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050286332.png",
                        currencySymbol: "NT$"
                    }
                } else if (curr.currency == "SGD") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050298827.png",
                        currencySymbol: "S$"
                    }
                } else if (curr.currency == "JPY") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050250987.png",
                        currencySymbol: "¥"
                    }
                } else if (curr.currency == "KRW") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703051478938.png",
                        currencySymbol: "₩"
                    }
                } else if (curr.currency == "IDR") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050059652.png",
                        currencySymbol: "rp"
                    }
                } else if (curr.currency == "THB") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703050028385.png",
                        currencySymbol: "฿"
                    }
                } else if (curr.currency == "VND") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703049972552.png",
                        currencySymbol: "₫"
                    }
                } else if (curr.currency == "INR") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703049943587.png",
                        currencySymbol: "₹"
                    }
                } else if (curr.currency == "NZD") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703049790534.png",
                        currencySymbol: "$"
                    }
                } else if (curr.currency == "AUD") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703049906995.png",
                        currencySymbol: "$"
                    }
                } else if (curr.currency == "MYR") {
                    return {
                        ...curr,
                        flag: "65646b89906a05a808345478/attachment/1703049922286.png",
                        currencySymbol: "RM"
                    }
                }
            })
        }
    })
    try {
        let response = await new challengeListModel(body).save()
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.addDataSuccess('challenge list'), response, {}));
        else return res.status(400).json(await apiResponse(400, responseMessage?.addDataError, {}, `${response}`));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const update_challenge_list = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        id = body?.id,
        user: any = req.header('user')
    delete body?.id
    body.updatedBy = user?._id
    try {
        let response = await challengeListModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, body, { new: true })
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.updateDataSuccess('challenge list'), response, {}));
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge list'), {}, `${response}`));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const delete_challenge_list = async (req: Request, res: Response) => {
    reqInfo(req)
    let id = req.params.id, user: any = req.header('user')
    try {
        let response: any = await challengeListModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, { isActive: false, updatedBy: new ObjectId(user?._id) })
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.deleteDataSuccess('challenge list'), {}, {}));
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge list'), {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_challenge_by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let challengeList: any = await challengeListModel.findOne({ _id: new ObjectId(req.params.id), isActive: true }, { updatedAt: 0, __v: 0 })
        if (!challengeList)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge list'), {}, {}))
        challengeList = JSON.parse(JSON.stringify(challengeList))
        await Promise.all(challengeList?.tradingCurrency?.map(async (data) => {
            data.currencyListData = await currencyListModel.findOne({ _id: new ObjectId(data?.currencyListId), isActive: true })
        }))
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('challenge list'), challengeList, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_challenge_list_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, search } = req.body,
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, workspaceId: user?.workspaceId },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (search && search != "") {
            let nameArray: Array<any> = []
            search = search.split(" ")
            await search.forEach(data => {
                nameArray.push({ name: { $regex: data, $options: 'si' } })
            })
            match.$or = nameArray;
        };
        [response, count] = await Promise.all([
            challengeListModel.aggregate([
                { $match: match },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { name: 1, description: 1, minimumTradingDays: 1, tradingPeriodDays: 1, platformPercentage: 1, userPercentage: 1, } },
            ]),
            challengeListModel.countDocuments(match)
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('challenge list'), {
            challenge_list_data: response,
            state: {
                page,
                limit,
                page_limit: Math.ceil(count / limit), data_count: count
            }
        }, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}