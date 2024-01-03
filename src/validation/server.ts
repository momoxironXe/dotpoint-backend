"use strict"
import * as Joi from "joi"
import { apiResponse, challengeUserPaymentCurrencyOption, findMissingElements } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const add_server = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is string!')),
        serverName: Joi.string().error(new Error('serverName is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        // if (findMissingElements(result.tradingCurrency, Object.values(challengeUserPaymentCurrencyOption))?.length > 0)
            // return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('tradingCurrency'), challengeUserPaymentCurrencyOption, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const get_server_list = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        page: Joi.number().error(new Error('page is number!')),
        limit: Joi.number().error(new Error('limit is number!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}