"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeUserModel, userModel } from '../../database'
import { apiResponse } from '../../common'
import { profitWithdrawalModel } from '../../database/models/profit_withdrawal'

const ObjectId = Types.ObjectId;

export const profit_withdrawal = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let body = req.body
        body.createdBy = req.header('user') as any
        let response = await new profitWithdrawalModel(body).save()
        if (response) {
            return res.status(200).json(await apiResponse(200, responseMessage.addDataSuccess('profit withdrawal'), response, {}));
        }
    } catch (error) {
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_list_profit_withdrawal = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, } = req.body,
    user = req.header('user') as any,
    skip: number,
    match: any = { isActive: true, isBlock: false, isApproval: true, createdBy: new ObjectId(user._id) },
    response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {

        [response, count] = await Promise.all([
            profitWithdrawalModel.aggregate([
                { $match: match },
                { $sort: { title: 1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'challenge_users',
                        localField: 'challengeUserId',
                        foreignField: '_id',
                        as: 'challengeUserData',
                    },
                },
                { $project: { __v: 0, createdBy: 0, updatedBy: 0 } },
            ]),
            profitWithdrawalModel.countDocuments(match)
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('profit withdrawal list'), {
            profit_withdrawal_list_data: response,
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