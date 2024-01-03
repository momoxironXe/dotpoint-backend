"use strict"
import { loginTokenResponseGenerator, reqInfo, } from '../../helper'
import { apiResponse, userType, } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { userModel, userSessionModel } from '../../database'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from 'config'
import { Types } from 'mongoose'
import { mailSend } from '../../helper/mailsend'

const jwt_token_secret = config.get('jwt_token_secret')
const refresh_jwt_token_secret = config.get('refresh_jwt_token_secret')
const ObjectId = Types.ObjectId

export const get_profile = async (req: Request, res: Response) => {
    reqInfo(req)
    let user = req.header('user')
    try {
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('profile'), user, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const signUp = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let body = req.body,
            authToken = 0
        let isAlready: any = await userModel.findOne({ email: body.email, isActive: true, isBlock: false })
        if (isAlready?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        if (isAlready) return res.status(409).json(await apiResponse(409, responseMessage.alreadyEmail, {}, {}));
        const salt = await bcryptjs.genSaltSync(10)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        delete body.password
        body.password = hashPassword
        body.username = body.name
        for (let flag = 0; flag < 1;) {
            authToken = await Math.round(Math.random() * 1000000)
            if (authToken.toString().length == 6) {
                flag++
            }
        }
        body.authToken = authToken
        body.userType = userType?.admin
        let response = await new userModel(body).save()
        mailSend(body.email, "Account created", `${body.firstName} your account successfully created`, "")
        return res.status(200).json(await apiResponse(200, responseMessage.signupSuccess, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

export const login = async (req: Request, res: Response) => {
    let body = req.body;
    reqInfo(req)
    try {
        let response: any = (await userModel.aggregate([
            { $match: { email: body.email, isActive: true, isBlock: false } },
        ]))[0]
        if (!response)
            return res.status(400).json(await apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}));
        if (response?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        const passwordMatch = await bcryptjs.compare(body.password, response.password)
        if (!passwordMatch) return res.status(400).json(await apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}));
        let token: any = await loginTokenResponseGenerator(response)
        if (token.error)
            res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
        return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const generate_refresh_token = async (req: Request, res: Response) => {
    let { old_token, refresh_token } = req.body;
    reqInfo(req)
    try {
        let isVerifyToken = jwt.verify(old_token, jwt_token_secret)
        if (parseInt(isVerifyToken.generatedOn + 120000) > new Date().getTime()) return res.status(400).json(await apiResponse(400, responseMessage?.tokenNotExpire, {}, {}))

        let refreshTokenVerify = jwt.verify(refresh_token, refresh_jwt_token_secret)
        if (refreshTokenVerify._id != isVerifyToken._id) return res.status(403).json(await apiResponse(403, responseMessage?.invalidOldTokenReFreshToken, {}, {}));

        let response = await userSessionModel.findOneAndUpdate({ createdBy: new ObjectId(isVerifyToken._id), refresh_token, isActive: true }, { isActive: false })
        if (response == null) return res.status(404).json(await apiResponse(404, responseMessage?.refreshTokenNotFound, {}, {}));
        let userData = await userModel.findOne({ _id: new ObjectId(response?.createdBy), isActive: true })
        let token: any = await loginTokenResponseGenerator(userData)

        if (token.error)
            res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
        return res.status(200).json(await apiResponse(200, responseMessage?.refreshTokenSuccess, token?.data, {}));

    } catch (error) {
        if (error.message == "invalid signature") return res.status(403).json(await apiResponse(403, responseMessage?.differentToken, {}, {}))
        if (error.message == "jwt malformed") return res.status(403).json(await apiResponse(403, responseMessage?.differentToken, {}, {}))
        if (error.message === "jwt must be provided") return res.status(403).json(await apiResponse(403, responseMessage?.tokenNotFound, {}, {}))
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}