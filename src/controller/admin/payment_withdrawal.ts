"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { paymentWithdrawModel } from '../../database'
import { apiResponse } from '../../common'

const ObjectId = Types.ObjectId;

export const payment_withdrawal_status_update = async (req: Request, res: Response) => {
    reqInfo(req)
    let user = req.header('user'), { id, status } = req.body
    try {
        let userIsExist = await paymentWithdrawModel.findOne({ _id: new ObjectId(id), isActive: true })
        if (!userIsExist)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('payment data'), {}, {}))
        userIsExist = await paymentWithdrawModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true }, { status }, { new: true })
        return res.status(200).json(await apiResponse(200, responseMessage?.customMessage('payment status updated'), userIsExist, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const payment_withdrawal_get_list = async (req: Request, res: Response) => {
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
            paymentWithdrawModel.aggregate([
                { $match: match },
                { $sort: { title: 1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __v: 0, createdBy: 0, updatedBy: 0 } },
            ]),
            paymentWithdrawModel.countDocuments(match)
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('withdrwal list'), {
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