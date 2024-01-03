"use strict"
import * as Joi from "joi"
import { apiResponse, challengeUserPaymentCurrencyOption, findMissingElements } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const payment_withdrawal = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        Withdrawal: Joi.number().required().error(new Error('Withdrawal is number!')),
        refund: Joi.number().required().error(new Error('refund is number!')),
        rollOver: Joi.number().required().error(new Error('refund is number!')),
        payoutChannel: Joi.string().required().error(new Error('payoutChannel is string!')),
        requirement: Joi.string().required().error(new Error('payoutChannel is string!'))
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const payment_withdrawal_status_update = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        id: Joi.string().required().error(new Error('id is string!')),
        status: Joi.string().required().error(new Error('status is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}