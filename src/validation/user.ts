"use strict"
import * as Joi from "joi"
import { apiResponse } from '../common'
import { isValidObjectId } from 'mongoose'
import { Request, Response } from 'express'
import { responseMessage } from "../helper"

export const signup = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        title: Joi.string().error(new Error('title is string!')),
        role: Joi.number().error(new Error('role is number!')),
        firstName: Joi.string().error(new Error('firstName is string!')),
        lastName: Joi.string().error(new Error('lastName is string!')),
        dob: Joi.string().allow('', null).error(new Error('dob is string!')),
        email: Joi.string().error(new Error('email is string!')),
        phoneNumber: Joi.string().error(new Error('phoneNumber is string!')),
        password: Joi.string().error(new Error('password is string!')),
        countryCode: Joi.string().error(new Error('countryCode is string!')),
        countryCode1: Joi.string().error(new Error('countryCode is string!')),
        state: Joi.string().allow('', null).error(new Error('state is string!')),
        city: Joi.string().allow('', null).error(new Error('city is string!')),
        street: Joi.string().allow('', null).error(new Error('street is string!')),
        country: Joi.string().allow('', null).error(new Error('country is string!')),
        postalCode: Joi.string().allow('', null).error(new Error('postalCode is string!')),
        image: Joi.string().error(new Error('image is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const update_profile = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        id: Joi.string().error(new Error('id is string!')),
        title: Joi.string().error(new Error('title is string!')),
        role: Joi.number().error(new Error('role is number!')),
        firstName: Joi.string().error(new Error('firstName is string!')),
        lastName: Joi.string().error(new Error('lastName is string!')),
        phoneNumber: Joi.string().error(new Error('phoneNumber is string!')),
        password: Joi.string().error(new Error('password is string!')),
        countryCode: Joi.string().error(new Error('countryCode is string!')),
        countryCode1: Joi.string().error(new Error('countryCode is string!')),
        state: Joi.string().allow('', null).error(new Error('state is string!')),
        city: Joi.string().allow('', null).error(new Error('city is string!')),
        street: Joi.string().allow('', null).error(new Error('street is string!')),
        country: Joi.string().allow('', null).error(new Error('country is string!')),
        postalCode: Joi.string().allow('', null).error(new Error('postalCode is string!')),
        image: Joi.string().error(new Error('image is string!')),
        airWallexUserId: Joi.string().required().error(new Error('airWallexUserId is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const unblock_block = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        id: Joi.string().required().error(new Error('id is required!')),
        isBlock: Joi.boolean().required().error(new Error('isBlock is required & boolean!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const social_login = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        accessToken: Joi.string().error(new Error('accessToken is string!')),
        idToken: Joi.string().error(new Error('idToken is string!')),
        clientId: Joi.string().error(new Error('clientId is string!')),
        deviceToken: Joi.string().error(new Error('deviceToken is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const generate_refresh_token = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        old_token: Joi.string().error(new Error('old_token is string!')),
        refresh_token: Joi.string().error(new Error('refresh_token is string!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const login = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        email: Joi.string().required().error(new Error('email is required!')),
        password: Joi.string().required().error(new Error('password is required!')),
        deviceToken: Joi.string().error(new Error('deviceToken is string!')),
        mobileOS: Joi.number().error(new Error('mobileOS is number!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const by_id = async (req: Request, res: Response, next: any) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('id'), {}, {}))
    return next()
}

export const forgot_password = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        oldEmail: Joi.string().required().error(new Error('old email is required!')),
        newEmail: Joi.string().required().error(new Error('new email is required!')),
    })
    schema.validateAsync(req.body).then(async result => {
        req.body = result
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const otp_verification = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        email: Joi.string().lowercase().required().error(new Error('email is required!')),
        otp: Joi.number().min(100000).max(999999).required().error(new Error('otp is required! & must be 6 digits')),
    })
    schema.validateAsync(req.body).then(async result => {
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}

export const change_password = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        id: Joi.string().required().error(new Error('id is required! ')),
        otp: Joi.string().required().error(new Error('otp is required! ')),
        old_password: Joi.string().required().error(new Error('old_password is required! ')),
        new_password: Joi.string().required().error(new Error('new_password is required! ')),
    })
    schema.validateAsync(req.body).then(async result => {
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})); })
}

export const reset_password = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        otp: Joi.number().min(100000).max(999999).required().error(new Error('otp is required! & must be 6 digits')),
        password: Joi.string().max(20).required().error(new Error('password is required! & max length is 20')),
    })
    schema.validateAsync(req.body).then(async result => {
        return next()
    }).catch(async error => {
        res.status(400).json(await apiResponse(400, error.message, {}, {}));
    })
}


export const reset_account = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        userId: Joi.string().required().error(new Error('userId is required! ')),
        challengeId: Joi.string().required().error(new Error('challengeId is required! ')),
    })
    schema.validateAsync(req.body).then(async result => {
        return next()
    }).catch(async error => { res.status(400).json(await apiResponse(400, error.message, {}, {})); })
}