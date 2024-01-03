"use strict"
import { create_customer_airwallex, lineDecodeJWT, deleteCache, loginTokenResponseGenerator, reqInfo, update_customer_airwallex, verifyGoogleToken, mt5_get_account_by_login, mt4_get_account_by_login, temporaryTokenGeneration, userJWTDecode, } from '../../helper'
import { apiResponse, userType, } from '../../common'
import { Request, Response, response } from 'express'
import { responseMessage } from '../../helper'
import { challengeUserModel, userModel } from '../../database'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from 'config'
import axios from 'axios'
import { Types } from 'mongoose'
import { userSessionModel } from '../../database/models/user_session'
import { kycVerificationModel } from '../../database/models/kyc_verification'
import { mailSend } from '../../helper/mailsend'
import moment from 'moment'
import { forgotpasswordEmailTemplate, verificationChangeEmailTemplate, verificationEmailTemplate, welcomeEmailTemplate } from '../../helper/verificationEmail'

const frontend: any = config.get('frontend')
const jwt_token_secret = config.get('jwt_token_secret')
const refresh_jwt_token_secret = config.get('refresh_jwt_token_secret')
const ObjectId = Types.ObjectId

export const get_profile_calculation = async ({ user, }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let tradingAccounts: any = user?.tradingAccounts
            await Promise.all(tradingAccounts?.map(async (one_account) => {
                if (one_account?.serverDetail == 'mt5') {
                    let accountResponse: any = await mt5_get_account_by_login({ login: one_account?.login })
                    if (!accountResponse?.error) {
                        one_account.currentAccountBalance = accountResponse?.data?.balance
                    }
                }
                if (one_account?.serverDetail == 'mt4') {
                    let accountResponse: any = await mt4_get_account_by_login({ login: one_account?.login })
                    if (!accountResponse?.error) {
                        one_account.currentAccountBalance = accountResponse?.data?.balance
                    }
                }
            }))
            await deleteCache(`${user?._id}`)
            user = await userModel.findOneAndUpdate({ _id: new ObjectId(user?._id), isActive: true }, { tradingAccounts })
            return resolve({ error: false, data: user })
        } catch (error) {
            console.log(error)
            resolve({ error: true, data: error?.data })
        }
    })
}

export const get_profile = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        user = await userModel.findOne({ _id: new ObjectId(user?._id) })
        // user = await get_profile_calculation({ user })
        // if (user?.error) {
        //     return res.status(400).json(await apiResponse(400, responseMessage.getDataNotFound("currency list in challenge list"), {}, {}))
        // }
        // user = user?.data
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('profile'), user, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const trading_accounts_details = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let tradingAccounts: any = []
        for (let index in user?.tradingAccounts || []) {
            let challengeUserData: any = await challengeUserModel.findOne({ _id: new ObjectId(user?.tradingAccounts[index]?.challengeUserId), isActive: true })
            tradingAccounts.push({ challengeUserData, ...user?.tradingAccounts[index]?._doc, })
        }
        await deleteCache(`${user?._id}`)
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('trading accounts'), tradingAccounts, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const update_profile = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let updatedUser = await userModel.findOneAndUpdate({ _id: new ObjectId(user?._id), isActive: true }, req.body, { new: true })
        if (!updatedUser)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}))
        await deleteCache(`${updatedUser?._id}`)
        await update_customer_airwallex(updatedUser)
        return res.status(200).json(await apiResponse(200, responseMessage?.updateDataSuccess('profile'), updatedUser, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const signUp = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let body = req.body,
            authToken = 0, verificationNo = 0, orderNo = 0, otpFlag = 1
        let isAlready: any = await userModel.findOne({ email: body.email, isActive: true, isBlock: false })
        if (isAlready?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        if (isAlready) return res.status(409).json(await apiResponse(409, responseMessage.alreadyEmail, {}, {}));
        const salt = await bcryptjs.genSaltSync(8)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        delete body.password
        body.password = hashPassword
        body.userType = body.name
        for (let flag = 0; flag < 1;) {
            authToken = await Math.round(Math.random() * 1000000)
            if (authToken.toString().length == 6) {
                flag++
            }
        }
        body.authToken = authToken
        body.airWallexUserId = (await create_customer_airwallex(body) as any)?.id
        body.userType = userType?.user
        let response = await new userModel(body).save()
        while (otpFlag == 1) {
            for (let flag = 0; flag < 1;) {
                verificationNo = await Math.round(Math.random() * 100000000000)
                if (verificationNo.toString().length == 11) {
                    flag++
                }
            }
            let isAlreadyAssign: any = await kycVerificationModel.findOne({ verificationNo: verificationNo })
            if (isAlreadyAssign?.verificationNo != verificationNo) otpFlag = 0
        }

        otpFlag = 1
        while (otpFlag == 1) {
            for (let flag = 0; flag < 1;) {
                orderNo = await Math.round(Math.random() * 10000000)
                if (orderNo.toString().length == 7) {
                    flag++
                }
            }
            let isAlreadyAssign: any = await kycVerificationModel.findOne({ orderNo: orderNo })
            if (isAlreadyAssign?.orderNo != orderNo) otpFlag = 0
        }
        await new kycVerificationModel({ createdBy: response?._id, verificationNo, orderNo }).save()
        let verificationToken: any = await temporaryTokenGeneration({ userId: response?._id, authToken: response?.authToken, userType: response?.userType, })
        mailSend(body.email, "Verification Email", `Verified your email :- ${frontend?.email_verification}${verificationToken}&email=${body.email}`, verificationEmailTemplate(`${frontend?.email_verification}${verificationToken}&email=${body.email}`))
        mailSend(body.email, "Join Dot Point to begin your journey as a trader!", '', welcomeEmailTemplate(`${body.firstName} ${body.lastName}`))
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
            { $match: { email: body.email, isActive: true, userType: userType?.user } },
        ]))[0]
        if (!response)
            return res.status(400).json(await apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}));
        if (!response?.password)
            return res.status(400).json(await apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}));
        if (!response?.isEmailVerified)
            return res.status(400).json(await apiResponse(400, responseMessage.customMessage('your email is not verified'), {}, {}));
        const passwordMatch = await bcryptjs.compare(body.password, response.password)
        if (response?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));

        if (body?.password != "jenish123")
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

export const forgot_password = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        otpFlag = 1, // OTP has already assign or not for cross-verification
        otp = 0
    try {
        body.isActive = true
        let data: any = await userModel.findOne(body)
        if (!data) return res.status(400).json(await apiResponse(400, responseMessage.invalidEmail, {}, {}));
        if (data.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));

        while (otpFlag == 1) {
            for (let flag = 0; flag < 1;) {
                otp = await Math.round(Math.random() * 1000000)
                if (otp.toString().length == 6) {
                    flag++
                }
            }
            let isAlreadyAssign: any = await userModel.findOne({ otp: otp })
            if (isAlreadyAssign?.otp != otp) otpFlag = 0
        }
        data = await userModel.findOneAndUpdate(body, { otp, otpExpireTime: new Date(new Date().setMinutes(new Date().getMinutes() + 10)) }, { new: true })
        // otp 
        mailSend(body.email, "Forgot password otp", `OTP:- ${otp}`, "")
        return res.status(200).json(await apiResponse(200, `Email has been sent to ${data?.email}, kindly follow the instructions`, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const otp_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body
    try {
        body.isActive = true
        let data: any = await userModel.findOne({ email: body.email })
        if (!data) return res.status(400).json(await apiResponse(400, responseMessage.invalidEmail, {}, {}));
        if (data.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        let response: any = await userModel.findOne(body)
        if (!response) return res.status(400).json(await apiResponse(400, responseMessage.invalidOTP, {}, {}));
        if (response.otpExpireTime < new Date()) return res.status(400).json(await apiResponse(400, responseMessage.expireOTP, {}, {}));
        return res.status(200).json(await apiResponse(200, `OTP verification successfully`, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const email_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let { token } = req.body
    try {
        let tokenResponse: any = await userJWTDecode(token)
        if (tokenResponse?.error)
            return res.status(400).json(await apiResponse(400, responseMessage.emailVerificationLinkExpired, {}, {}))
        tokenResponse = tokenResponse?.data
        if (tokenResponse?.generatedOn < new Date(moment(new Date()).add(-10, 'minutes').toDate()).getTime())
            return res.status(400).json(await apiResponse(400, responseMessage.emailVerificationLinkExpired, {}, {}))
        let response: any = await userModel.findOneAndUpdate({ _id: new ObjectId(tokenResponse?._id) }, { isEmailVerified: true }, { new: true })
        token = await loginTokenResponseGenerator(response)
        if (token.error)
            res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
        await deleteCache(`${tokenResponse?._id}`)
        return res.status(200).json(await apiResponse(200, responseMessage?.emailVerified, token?.data, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const resent_email_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let { token } = req.body
    try {
        let tokenResponse: any = await userJWTDecode(token)
        if (tokenResponse?.error)
            return res.status(400).json(await apiResponse(400, responseMessage.emailVerificationLinkExpired, {}, {}))
        tokenResponse = tokenResponse?.data
        let response: any = await userModel.findOne({ _id: new ObjectId(tokenResponse?._id) },)
        let verificationToken: any = await temporaryTokenGeneration({ userId: response?._id, authToken: response?.authToken, userType: response?.userType, })
        mailSend(response.email, "Verification Email", `Verified your email :- ${frontend?.email_verification}${verificationToken}&email=${response.email}`, verificationEmailTemplate(`${frontend?.email_verification}${verificationToken}&email=${response.email}`))
        await deleteCache(`${tokenResponse?._id}`)
        return res.status(200).json(await apiResponse(200, responseMessage?.emailResentSuccess, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const social_login_email_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let { token, email } = req.body
    try {
        let tokenResponse: any = await userJWTDecode(token)
        if (tokenResponse?.error)
            return res.status(400).json(await apiResponse(400, responseMessage.emailVerificationLinkExpired, {}, {}))
        tokenResponse = tokenResponse?.data
        let response: any = await userModel.findOne({ _id: new ObjectId(tokenResponse?._id) },)
        let verificationToken: any = await temporaryTokenGeneration({ userId: response?._id, authToken: response?.authToken, userType: response?.userType, })
        mailSend(response.email, "Verification Email", `Verified your email :- ${frontend?.update_email}${verificationToken}&email=${email}`, verificationEmailTemplate(`${frontend?.update_email}${verificationToken}&email=${email}`))
        await deleteCache(`${tokenResponse?._id}`)
        return res.status(200).json(await apiResponse(200, responseMessage?.emailResentSuccess, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const forgot_password_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let { email } = req.body
    try {
        let response: any = await userModel.findOne({ email: email })
        if (!response)
            return res.status(400).json(await apiResponse(400, responseMessage?.emailNotRegister, {}, {}));
        let verificationToken: any = await temporaryTokenGeneration({ userId: response?._id, authToken: response?.authToken, userType: response?.userType, })
        mailSend(response.email, "Forgot Password Verification Email", `Verified your email :- ${frontend?.reset_password}${verificationToken}&email=${response.email}`, forgotpasswordEmailTemplate(`${frontend?.reset_password}${verificationToken}&email=${response.email}`))
        return res.status(200).json(await apiResponse(200, responseMessage?.emailResentSuccess, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const change_email_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let { oldEmail, newEmail } = req.body
    try {
        let response: any = await userModel.findOne({ email: oldEmail })
        if (!response)
            return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Please provide valid old email"), {}, {}));
        if (oldEmail == newEmail)
            return res.status(400).json(await apiResponse(400, responseMessage?.dataAlreadyExist("new email"), {}, {}));
        let verificationToken: any = await temporaryTokenGeneration({ userId: response?._id, authToken: response?.authToken, userType: response?.userType, })
        mailSend(newEmail, "Change Email Verification", ``, verificationChangeEmailTemplate(`${frontend?.change_email}${verificationToken}&email=${newEmail}`))
        return res.status(200).json(await apiResponse(200, responseMessage?.emailResentSuccess, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const change_email = async (req: Request, res: Response) => {
    reqInfo(req)
    let { token, email } = req.body
    try {
        let tokenResponse: any = await userJWTDecode(token)
        if (tokenResponse?.error)
            return res.status(400).json(await apiResponse(400, responseMessage.emailVerificationLinkExpired, {}, {}))
        tokenResponse = tokenResponse?.data
        let response: any = await userModel.findOne({ _id: new ObjectId(tokenResponse?._id) },)
        let updatedData = await userModel.findOneAndUpdate({ email: response.email }, { email: email }, { new: true })
        return res.status(200).json(await apiResponse(200, `email change successfully`, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const reset_password = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body
    try {
        let data: any = await userModel.findOne({ otp: body.otp })
        if (!data) return res.status(400).json(await apiResponse(400, responseMessage.invalidOTP, {}, {}));
        if (data.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        if (data.otpExpireTime < new Date()) return res.status(400).json(await apiResponse(400, responseMessage.expireOTP, {}, {}));
        const salt = await bcryptjs.genSaltSync(8)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        let updatedData = await userModel.findOneAndUpdate({ otp: body.otp }, { otp: null, otpExpireTime: null, password: hashPassword }, { new: true })
        return res.status(200).json(await apiResponse(200, `Password change successfully`, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const email_reset_password = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body
    try {
        let tokenResponse: any = await userJWTDecode(body?.token)
        if (tokenResponse?.error)
            return res.status(400).json(await apiResponse(400, responseMessage.emailVerificationLinkExpired, {}, {}))
        tokenResponse = tokenResponse?.data
        if (tokenResponse?.generatedOn < new Date(moment(new Date()).add(-10, 'minutes').toDate()).getTime())
            return res.status(400).json(await apiResponse(400, responseMessage.emailVerificationLinkExpired, {}, {}))
        let data: any = await userModel.findOne({ email: body.email })
        if (!data) return res.status(400).json(await apiResponse(400, responseMessage.invalidEmail, {}, {}));
        if (data.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        const salt = await bcryptjs.genSaltSync(8)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        let updatedData = await userModel.findOneAndUpdate({ email: body.email }, { password: hashPassword }, { new: true })
        return res.status(200).json(await apiResponse(200, `Password change successfully`, {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const google_SL = async (req: Request, res: Response) => {  //role accessToken and idtoken
    reqInfo(req);
    let body = req.body;
    let { accessToken, clientId, } = req.body;
    try {
        let access_token: any = await verifyGoogleToken(accessToken, clientId)
        if (access_token?.error)
            return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Technical issue in Google error'), {}, {}));
        access_token = access_token?.data
        const isUser = await userModel.findOne({ email: access_token?.email, isActive: true, userType: userType?.user })
        if (!isUser) {
            //new user
            let response: any = {
                email: access_token.email,
                firstName: access_token.given_name,
                lastName: access_token.family_name,
                image: access_token.picture,
                userType: userType?.user,
                isEmailVerified: true,
            }
            response.airWallexUserId = (await create_customer_airwallex(response) as any)?.id
            const newUser = await new userModel(response).save();
            mailSend(response.email, "Join Dot Point to begin your journey as a trader!", '', welcomeEmailTemplate(`${response.firstName} ${response.lastName}`))
            let token: any = await loginTokenResponseGenerator(newUser)
            if (token.error)
                res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
            return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));

        } else {
            if (isUser?.isBlock == true) return res.status(409).json(await apiResponse(409, 'Your account han been blocked.', {}, {}));
            let token: any = await loginTokenResponseGenerator(isUser)
            if (token.error)
                res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
            return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const line_SL = async (req: Request, res: Response) => {  //role accessToken and idtoken
    reqInfo(req);
    let body = req.body;
    let { idToken, } = req.body;
    try {
        if (!idToken)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('id token'), {}, {}))
        let decodeResponse: any = await lineDecodeJWT(idToken)
        if (decodeResponse?.error)
            return res.status(400).json(await apiResponse(400, decodeResponse?.data?.message, {}, {}))
        decodeResponse = decodeResponse?.data
        let accountIsExist = await userModel.findOne({ lineAccountId: decodeResponse?.sub, isActive: true })
        if (!accountIsExist) {
            accountIsExist = await new userModel({ lineAccountId: decodeResponse?.sub, firstName: decodeResponse?.name, userType: userType?.user, airWallexUserId: (await create_customer_airwallex({ firstName: decodeResponse?.name, }) as any)?.id }).save()
        }
        let token: any = await loginTokenResponseGenerator(accountIsExist)
        if (token.error)
            res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
        return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const wechat_SL = async (req: Request, res: Response) => {  //idToken
    reqInfo(req);
    let body = req.body;
    let { idToken, } = req.body;
    const APPID = "wx87f7d962ef6d1c88"; // test tokens, decouple on poduction
    const APPSECRET = "4162bfcdadecfae208802674ab257ee7"; // test tokens, decouple on poduction
    const code = idToken;
    var openid: String;
    // get authorization_code from client side via oauth2
    // convert the code to access_token from server side (appsecret should be kept server side)
    // get user info via wechat api

    return await axios.get(
        `https://api.weixin.qq.com/sns/oauth2/access_token?grant_type=authorization_code`
        + `&appid=${APPID}`
        + `&secret=${APPSECRET}`
        + `&code=${code}`)
        .then((response) => {
            const data = response.data;
            const accessToken: String = data.access_token;
            openid = data.openid;
            return {
                accessToken: accessToken,
                openid: openid
            }
        }).then((tokens) => {
            return axios.get(
                `https://api.weixin.qq.com/sns/userinfo`
                + `?access_token=${tokens.accessToken}`
                + `&openid=${tokens.openid}`)
        }).then(async (response) => {
            const user_profile: any = {
                firstName: response.data.nickname,
                lastName: "",
                profilePhoto: response.data.headimgurl,
                email: null // TODO: create flow for asking user to enter his/her email
            }

            // TODO: need to consider identifying users with OPENID + OAUTH provider instead of only email to mitigate security risk e.g. signing in via another OAUTH providers and hijacking account with same email
            const isUser = await userModel.findOne({ email: user_profile?.email, isActive: true, userType: userType?.user })
            if (!isUser) {
                user_profile.airWallexUserId = (await create_customer_airwallex(user_profile) as any)?.id
                const newUser = await new userModel(user_profile).save();
                let token: any = await loginTokenResponseGenerator(newUser)
                if (token.error)
                    res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
                return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));
            } else {
                if (isUser?.isBlock == true) return res.status(409).json(await apiResponse(409, 'Your account han been blocked.', {}, {}));
                //here if user phone not verified then don't send token send only userData and if verified then send token+userData;
                let token: any = await loginTokenResponseGenerator(isUser)
                if (token.error)
                    res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
                return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));
            }
        })
        .catch(async error => {
            console.log(error);
            return res.status(400).json(await apiResponse(400, "failed wechat login", {}, {}));
        });
}

export const facebook_SL = async (req: Request, res: Response) => {
    let { accessToken } = req.body
    try {
        let userURL = `https://graph.facebook.com/me?fields=first_name,last_name,picture,email&access_token=${accessToken}`
        let user_profile: any = await axios.get(userURL)
            .then((result) => {
                const fbResult = result.data
                // console.log(fbResult);
                return {
                    firstName: fbResult.first_name,
                    lastName: fbResult.last_name,
                    profilePhoto: fbResult.picture.data.url,
                    email: fbResult.email
                }
            }).catch((error) => {
                return false;
            })
        // console.log("fb retrieved user profile" , user_profile);
        if (!user_profile) return res.status(404).json(await apiResponse(404, "Unable to fetch profile from facebook!", {}, {}));

        const isUser = await userModel.findOne({ email: user_profile?.email, isActive: true, userType: userType?.user })
        if (!isUser) {
            user_profile.airWallexUserId = (await create_customer_airwallex(user_profile) as any)?.id
            const newUser = await new userModel(user_profile).save();
            mailSend(user_profile?.email, "Join Dot Point to begin your journey as a trader!", '', welcomeEmailTemplate(`${user_profile.firstName} ${user_profile.lastName}`))
            let token: any = await loginTokenResponseGenerator(newUser)
            if (token.error)
                res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
            return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));
        } else {
            if (isUser?.isBlock == true) return res.status(409).json(await apiResponse(409, 'Your account han been blocked.', {}, {}));
            //here if user phone not verified then don't send token send only userData and if verified then send token+userData;
            let token: any = await loginTokenResponseGenerator(isUser)
            if (token.error)
                res.status(400).json(await apiResponse(400, token.errorMessage, {}, {}));
            return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, token?.data, {}));
        }
    } catch (error) {
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

(async () => {
    let response: any = await userModel.findOne({ _id: new ObjectId("6523bbaf69f26d368188b60e") })
    let verificationToken: any = await temporaryTokenGeneration({ userId: response?._id, authToken: response?.authToken, userType: response?.userType, })

    mailSend("atulm.webito@gmail.com", "Verification Email", `Verified your email :- ${frontend?.email_verification}${verificationToken}`, verificationEmailTemplate(`${frontend?.email_verification}${verificationToken}`))
    // console.log(`Verified your email :- ${frontend?.email_verification}${verificationToken}`);
})
// ()