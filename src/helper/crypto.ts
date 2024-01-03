"use strict"
import crypto from "crypto"
import config from 'config'
import { Request, Response } from 'express'
import { apiResponse } from "../common"
import { responseMessage } from "./response"

const body_security: any = config.get('body_security')

export const encryptData = async (dataObject: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            let cipher, encrypted
            if (!body_security?.encryption)
                resolve(dataObject);
            cipher = await crypto.createCipheriv('aes-256-cbc', body_security?.key, body_security?.IV);
            encrypted = await cipher.update(JSON.stringify(dataObject), 'utf8', 'base64');
            encrypted += await cipher.final('base64');
            resolve(encrypted)
        }
        catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

export const decryptData = async (req: Request, res: Response, next: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (body_security?.decryption && !req.body?.data && Object.keys(req.body)?.length != 0)
                return res.status(400).json(await apiResponse(400, responseMessage?.invalidId('data'), {}, {}))
            if (body_security?.decryption && req.body?.data) {
                let decipher = await crypto.createDecipheriv('aes-256-cbc', body_security?.key, body_security?.IV);
                let decrypted = await decipher.update(req?.body?.data, 'base64', 'utf8');
                req.body = JSON.parse((decrypted + decipher.final('utf8')));
                next()
            }
            else
                next()
        }
        catch (error) {
            console.log(error)
            return res.json(await apiResponse(400, responseMessage?.decryptionError, {}, error))
        }
    })
}

export const decryptDataAPI = async (req: Request, res: Response) => {
    try {
        if (body_security?.decryption && req.body?.data) {
            let decipher = await crypto.createDecipheriv('aes-256-cbc', body_security?.key, body_security?.IV);
            let decrypted = await decipher.update(req?.body?.data, 'base64', 'utf8');
            return res.status(200).json({
                status: 200,
                message: responseMessage?.decryptionSuccess,
                data: await JSON.parse((decrypted + decipher.final('utf8'))),
                error: {}
            })
        }
        else
            return res.status(200).json(await apiResponse(200, responseMessage?.decryptionError, {}, {}))
    }
    catch (error) {
        console.log(error)
        return res.json(await apiResponse(400, responseMessage?.decryptionError, {}, {}))
    }
}

export const encryptDataAPI = async (req: Request, res: Response) => {
    try {
        return res.status(200).json(await apiResponse(200, responseMessage?.encryptionSuccess, req.body, {}))
    }
    catch (error) {
        console.log(error)
        return res.json(await apiResponse(400, responseMessage?.encryptionError, {}, {}))
    }
}