"use strict"
import * as Joi from "joi"
import { apiResponse, challengeUserPaymentCurrencyOption, findMissingElements } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const add_update_challenge_list = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is string!')),
        name: Joi.string().error(new Error('name is string!')),
        description: Joi.string().error(new Error('description is string!')),
        tradingCurrency: Joi.array().error(new Error('tradingCurrency is array!')),
        platformOption: Joi.array().error(new Error('platformOption is array!')),
        challengeLevel: Joi.number().error(new Error('challengeLevel is number!')),
        platformPercentage: Joi.number().error(new Error('platformPercentage is number!')),
        userPercentage: Joi.number().error(new Error('userPercentage is number!')),
        challengeAmount: Joi.number().error(new Error('challengeAmount is number!')),
        minimumTradingDays: Joi.number().error(new Error('minimumTradingDays is number!')),
        serverDetailId: Joi.string().error(new Error('serverDetailId is string!')),
        breachRules: Joi.array().error(new Error('breachRules is array!')),
        levelUpRules: Joi.array().error(new Error('levelUpRules is array!')),
        // accountBalance: Joi.number().error(new Error('accountBalance is number!')),
        platformAmount: Joi.number().error(new Error('platformAmount is number!')),
        tradingPeriodDays: Joi.number().error(new Error('tradingPeriodDays is number!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        // if (findMissingElements(result.tradingCurrency, Object.values(challengeUserPaymentCurrencyOption))?.length > 0)
        // return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('tradingCurrency'), challengeUserPaymentCurrencyOption, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const get_challenge_list_pagination = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        search: Joi.string().error(new Error('search is string!')),
        page: Joi.number().error(new Error('page is number!')),
        limit: Joi.number().error(new Error('limit is number!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}