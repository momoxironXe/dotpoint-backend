"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeListModel, currencyListModel } from '../../database'
import { apiResponse } from '../../common'

const ObjectId = Types.ObjectId

export const get_challenge_list_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, riskModeOption } = req.body,
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (riskModeOption != null || riskModeOption != undefined)
            match.riskModeOption = riskModeOption;
        [response, count] = await Promise.all([
            challengeListModel.aggregate([
                { $match: match },
                { $sort: { title: 1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "server_lists",
                        let: { serverDetailId: '$serverDetailId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$_id', '$$serverDetailId'] },
                                            { $eq: ['$isActive', true] },
                                            { $eq: ['$isBlock', false] },
                                        ],
                                    },
                                }
                            },
                            { $project: { serverName: 1 } },
                        ],
                        as: "server_list"
                    }
                },
                { $project: { __v: 0, createdBy: 0, updatedBy: 0 } },
            ]),
            challengeListModel.countDocuments(match)
        ])
        await Promise.all(response?.map(async (one_challenge) => {
            await Promise.all(one_challenge?.tradingCurrency?.map(async (data) => {
                data.currencyListData = await currencyListModel.findOne({ _id: new ObjectId(data?.currencyListId), isActive: true })
            }))
        }))

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