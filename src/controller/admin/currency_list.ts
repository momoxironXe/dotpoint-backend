"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { currencyListModel } from '../../database'
import { apiResponse } from '../../common'

const ObjectId = Types.ObjectId

export const add_currency_list = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        user: any = req.header('user')
    body.createdBy = user?._id
    body.workspaceId = user?.workspaceId
    try {
        let AlReadyExistName = await currencyListModel.findOne({ name: body.name })
        if (AlReadyExistName) return res.status(400).json(await apiResponse(400, responseMessage?.dataAlreadyExist("currency name"), {}, {}));
        let AlReadyExistCode = await currencyListModel.findOne({ name: body.code })
        if (AlReadyExistCode) return res.status(400).json(await apiResponse(400, responseMessage?.dataAlreadyExist("currency code"), {}, {}));
        let response = await new currencyListModel(body).save()
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.addDataSuccess('currency list'), response, {}));
        else return res.status(400).json(await apiResponse(400, responseMessage?.addDataError, {}, `${response}`));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const update_currency_list = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        id = body?.id,
        user: any = req.header('user')
    delete body?.id
    body.updatedBy = user?._id
    try {
        let response = await currencyListModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, body, { new: true })
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.updateDataSuccess('currency list'), response, {}));
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('currency list'), {}, `${response}`));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const delete_currency_list = async (req: Request, res: Response) => {
    reqInfo(req)
    let id = req.params.id, user: any = req.header('user')
    try {
        let response: any = await currencyListModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, { isActive: false, updatedBy: new ObjectId(user?._id) })
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.deleteDataSuccess('currency list'), {}, {}));
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('currency list'), {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_currency_by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let currencyList = await currencyListModel.findOne({ _id: new ObjectId(req.params.id), isActive: true }, { updatedAt: 0, __v: 0 })
        if (!currencyList)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('currency list'), {}, {}))
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('currency list'), currencyList, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_currency_list_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, } = req.body,
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, workspaceId: user?.workspaceId },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        [response, count] = await Promise.all([
            currencyListModel.aggregate([
                { $match: match },
                { $sort: { name: 1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { isActive: 0, isBlock: 0, updatedAt: 0, __v: 0, updatedBy: 0, workspaceId: 0 } },
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