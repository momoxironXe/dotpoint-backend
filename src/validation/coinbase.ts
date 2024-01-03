"use strict"
import * as Joi from "joi"
import { apiResponse } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const create_payment_coinbase_link_of_challenge_list = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    challengeUserId: Joi.string().allow(null, "").error(new Error('challengeUserId is string!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}