"use strict"
import * as Joi from "joi"
import { apiResponse } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const create_payment_airwallex_intent = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    currency: Joi.string().allow(null, "").error(new Error('currency is string!')),
    amount: Joi.number().error(new Error('amount is number!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const confirm_payment_airwallex_intent = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    origin: Joi.string().allow(null, "").error(new Error('origin is string!')),
    intentId: Joi.string().allow(null, "").error(new Error('intentId is string!')),
    card: Joi.object().error(new Error('card is object!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const create_payment_airwallex_link = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    amount: Joi.number().error(new Error('amount is number!')),
    currency: Joi.string().allow(null, "").error(new Error('currency is string!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const create_payment_airwallex_link_of_challenge_list = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    challengeUserId: Joi.string().allow(null, "").error(new Error('challengeUserId is string!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const challenge_payment_confirmation = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    challengeUserId: Joi.string().allow(null, "").error(new Error('challengeUserId is string!')),
    paymentLinkId: Joi.string().allow(null, "").error(new Error('paymentLinkId is string!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}

export const get_payment_airwallex_link = async (req: Request, res: Response, next) => {
  const schema = Joi.object({
    paymentLinkId: Joi.string().allow(null, "").error(new Error('paymentLinkId is string!')),
  })
  schema.validateAsync(req.body).then(async result => {
    if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
    return next()
  }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}