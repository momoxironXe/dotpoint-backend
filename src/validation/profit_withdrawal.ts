"use strict"
import * as Joi from "joi"
import { apiResponse, challengeUserPaymentCurrencyOption, findMissingElements } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const profit_withdrawal = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        withdrawalAmount: Joi.number().required().error(new Error('withdrawalAmount is number!')),
        refund: Joi.number().optional().error(new Error('refund is number!')),
        rollover: Joi.number().optional().error(new Error('rollover is number!')),
        payoutChannel: Joi.string().optional().error(new Error('payoutChannel is string!')),
        specialRequirement: Joi.boolean().optional().error(new Error('specialRequirement is Boolean!')),
        challengeUserId: Joi.string().required().error(new Error('challengeUserId is string!')),
        bankName: Joi.string().required().error(new Error('bankName is string!')),
        accountNumber: Joi.number().required().error(new Error('accountNumber is number!')),
        ifscCode: Joi.string().required().error(new Error('ifscCode is string!')),
        reason: Joi.string().allow('', null).error(new Error('reason is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}