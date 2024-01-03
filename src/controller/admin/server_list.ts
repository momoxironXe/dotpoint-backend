"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { apiResponse } from '../../common'
import { serverListModel } from '../../database'

const ObjectId = Types.ObjectId

export const add_server = async (req: Request, res: Response) => {
    reqInfo(req)
    let server = req.header('server'), body = req.body
    try {
        let isAlready: any = await serverListModel.findOne({ serverName: body.serverName, isActive: true, isBlock: false })
        if (isAlready?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        if (isAlready) return res.status(409).json(await apiResponse(409, responseMessage.customMessage("server is already exit"), {}, {}));
        let response = await new serverListModel(body).save()
        return res.status(200).json(await apiResponse(200, responseMessage.addDataSuccess('server'), response, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const get_server_list = async (req: Request, res: Response) => {
    reqInfo(req)
    let server = req.header('server');
    try {
        let serverList: any = await serverListModel.find({ isActive: true, isBlock: false })
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('server'), serverList, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const delete_server = async (req: Request, res: Response) => {
    reqInfo(req)
    let id = req.params.id, server: any = req.header('server')
    try {
        let response: any = await serverListModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, { isActive: false, updatedBy: new ObjectId(server?._id) })
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.deleteDataSuccess('server'), {}, {}));
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('server'), {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}