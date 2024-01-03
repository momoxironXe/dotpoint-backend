"use strict"
import * as Joi from "joi"
import { apiResponse, serverDetailArray } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const buy_challenge = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is string!')),
        currencyListId: Joi.string().error(new Error('currencyListId is string!')),
        challengeListId: Joi.string().error(new Error('challengeListId is string!')),
        currencyCode: Joi.string().error(new Error('currencyCode is string!')),
        challengeType: Joi.number().error(new Error('challengeType is number!')),
        accountType: Joi.number().error(new Error('accountType is number!')),
        platform: Joi.number().error(new Error('platform is number!')),
        billingInfo: Joi.object().error(new Error('billingInfo is object!')),
        isReadTermsAndConditions: Joi.boolean().error(new Error('isReadTermsAndConditions is boolean!')),
        isReadRefundPolicy: Joi.boolean().error(new Error('isReadRefundPolicy is boolean!')),
        workspaceId: Joi.string().allow('', null).error(new Error('workspaceId is string!')),
        serverDetail: Joi.string().required().allow('', null).error(new Error('serverDetail is string!')),
        endChallengeDate: Joi.string().required().allow('', null).error(new Error('endChallengeDate is string!')),
        platformOption: Joi.number().required().error(new Error('platformOption is number!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        if (!serverDetailArray.includes(result?.serverDetail)) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('serverDetail'), { valid: serverDetailArray }, {}));
        // if (findMissingElements(result.tradingCurrency, Object.values(challengeUserPaymentCurrencyOption))?.length > 0)
        // return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('tradingCurrency'), challengeUserPaymentCurrencyOption, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const get_buy_challenge_list_pagination = async (req: Request, res: Response, next) => {
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

export const payout_request = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is string!')),
        isApproval: Joi.boolean().error(new Error('isApproval is boolean!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}