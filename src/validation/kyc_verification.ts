"use strict"
import * as Joi from "joi"
import { apiResponse, } from '../common'
import { Request, Response } from 'express'
import { isValidObjectId } from "mongoose"
import { responseMessage } from "../helper"

export const kyc_verification = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        _id: Joi.string().error(new Error('id is required!')),
        credentialType: Joi.string().allow('', null).error(new Error('credentialType is required!')),
        firstName: Joi.string().error(new Error('firstName is required!')),
        middleName: Joi.string().allow("", null).error(new Error('middleName is required!')),
        surname: Joi.string().error(new Error('surname is required!')),
        dob: Joi.string().allow("", null).error(new Error('dob is required!')),
        street: Joi.string().allow('', null).error(new Error('street is required!')),
        city: Joi.string().allow('', null).error(new Error('city is required!')),
        zipcode: Joi.string().allow('', null).error(new Error('zipcode is required!')),
        country: Joi.string().error(new Error('country is required!')),
        documentType: Joi.string().error(new Error('documentType is required!')),
        frontSideDoc: Joi.string().error(new Error('frontSideDoc is required!')),
        backSideDoc: Joi.string().allow("", null).error(new Error('backSideDoc is required!')),
        selfieDoc: Joi.string().error(new Error('selfieDoc is required!')),
        step4QuestionsList: Joi.array().error(new Error('step4QuestionsList is array!')),
        isQuestionAgree: Joi.boolean().error(new Error('isQuestionAgree is required!')),
        isPolicyAgree: Joi.boolean().error(new Error('isPolicyAgree is required!')),
        status: Joi.number().error(new Error('status is required!')),
        note: Joi.string().error(new Error('note is required!')),
        accountAgree: Joi.boolean().error(new Error('note is required!')),
        isUnderReview: Joi.boolean().error(new Error('isUnderReview is required!')),
        addressProofDoc: Joi.string().allow('', null).error(new Error('addressProofDoc is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        if (!isValidObjectId(result.id) && result.id) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}));
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})) })
}