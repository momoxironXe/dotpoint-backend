"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { currencyListModel } from '../../database'
import { apiResponse } from '../../common'

const ObjectId = Types.ObjectId

export const get_currency_list_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, } = req.body,
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {

        [response, count] = await Promise.all([
            currencyListModel.aggregate([
                { $match: match },
                { $sort: { title: 1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __v: 0, createdBy: 0, updatedBy: 0 } },
            ]),
            currencyListModel.countDocuments(match)
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('currency list'), {
            currency_list_data: response,
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