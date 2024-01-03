"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeUserModel } from '../../database'
import { apiResponse } from '../../common'
import { kycVerificationModel } from '../../database/models/kyc_verification'
import axios from 'axios'

const ObjectId = Types.ObjectId

export const kyc_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        user: any = req.header('user')
    body.createdBy = user?._id
    try {
        if (body?._id) {
            body.status = 3
            let response = await kycVerificationModel.findOneAndUpdate({ _id: new ObjectId(body._id), isActive: true, isBlock: false }, body, { new: true })
            return res.status(200).json(await apiResponse(200, responseMessage.updateDataSuccess("kyc verification"), response, {}))
        } else {
            let response = await new kycVerificationModel(body).save()
            return res.status(200).json(await apiResponse(200, responseMessage.addDataSuccess('kyc verification'), response, {}));
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const get_kyc_verification_by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let currencyList = await kycVerificationModel.findOne({ createdBy: new ObjectId(user._id), isActive: true }, { updatedAt: 0, __v: 0 })
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('kyc verification'), currencyList, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_economic_calendar = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        await axios.post(
            `https://www.forexfactory.com/calendar/apply-settings/1?navigation=0`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                },
            },
        ).then((data) => {
            return data
        }).catch((error) => {
            console.log(error);
            return error
        })
    } catch (error) {
        console.log(error)
        return error
    }
}