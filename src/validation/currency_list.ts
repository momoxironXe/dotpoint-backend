"use strict"
import * as Joi from "joi"
import { apiResponse, } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const add_update_currency_list = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is string!')),
        name: Joi.string().error(new Error('name is string!')),
        image: Joi.string().error(new Error('image is string!')),
        code: Joi.string().error(new Error('code is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const get_currency_list_pagination = async (req: Request, res: Response, next) => {
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