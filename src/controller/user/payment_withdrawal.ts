"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeUserModel, userModel } from '../../database'
import { apiResponse } from '../../common'
import { paymentWithdrawModel } from '../../database/models/payment_withdraw'

const ObjectId = Types.ObjectId;

export const payment_withdrawal = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body
    body.status = "pending"
    try {
        let response = await new paymentWithdrawModel(req.body).save()
        if (response) {
            return res.status(200).json(await apiResponse(200, responseMessage.addDataSuccess('payment withdrawal'), response, {}));
        }
    } catch (error) {
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}