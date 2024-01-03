"use strict"
import * as Joi from "joi"
import { apiResponse } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const customer_support = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    id: Joi.string().error(new Error('id is string!')),
    subject: Joi.string().allow(null, "").error(new Error('subject is string!')),
    content: Joi.string().allow(null, "").error(new Error('content is string!')),
    attachments: Joi.array().error(new Error('attachments is array!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}