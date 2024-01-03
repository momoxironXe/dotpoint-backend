import jwt from 'jsonwebtoken'
import config from 'config'
import { userModel, } from '../database'
import mongoose from 'mongoose'
import { apiResponse, } from '../common'
import { Request, Response } from 'express'
import { responseMessage } from './response'
import { getCache, setCache } from './caching'
import { userSessionModel } from '../database/models/user_session'
import { OAuth2Client } from 'google-auth-library'

const ObjectId = mongoose.Types.ObjectId
const jwt_token_secret = config.get('jwt_token_secret')
const line: any = config.get('line')
const refresh_jwt_token_secret = config.get('refresh_jwt_token_secret')
const access_token_duration = config.get('access_token_duration')

export const userJWT = async (req: Request, res: Response, next) => {
    let { authorization, userType } = req.headers,
        result: any
    if (authorization) {
        try {
            let isVerifyToken = jwt.verify(authorization, jwt_token_secret)
            // result = await getCache(`${isVerifyToken?._id}`)
            if (!result) {
                result = await userModel.findOne({ _id: new ObjectId(isVerifyToken._id), isActive: true })
                await setCache(`${result?._id}`, JSON.stringify(result))
            } else result = JSON.parse(result)
            if (result?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage?.accountBlock, {}, {}));
            if (isVerifyToken?.userType != userType) return res.status(403).json(await apiResponse(403, responseMessage?.accessDenied, {}, {}));
            if (isVerifyToken.exp < new Date().getTime()) {
                return res.status(410).json(await apiResponse(410, responseMessage?.tokenExpire, {}, {}))
            }
            if (result?.isActive == true && isVerifyToken.authToken == result.authToken && isVerifyToken?.userType == result?.userType) {
                // Set in Header Decode Token Information
                req.headers.user = result
                return next()
            } else {
                return res.status(401).json(await apiResponse(401, responseMessage?.invalidToken, {}, {}))
            }
        } catch (err) {
            if (err.message == "invalid signature") return res.status(403).json(await apiResponse(403, responseMessage?.differentToken, {}, {}))
            console.log(err)
            return res.status(401).json(await apiResponse(401, responseMessage.invalidToken, {}, {}))
        }
    } else {
        return res.status(401).json(await apiResponse(401, responseMessage?.tokenNotFound, {}, {}))
    }
}

export const adminJWT = async (req: Request, res: Response, next) => {
    let { authorization, userType } = req.headers,
        result: any
    if (authorization) {
        try {
            let isVerifyToken = jwt.verify(authorization, jwt_token_secret)
            // result = await getCache(`${isVerifyToken?._id}`)
            if (!result) {
                result = await userModel.findOne({ _id: new ObjectId(isVerifyToken._id), isActive: true })
                await setCache(`${result?._id}`, JSON.stringify(result))
            } else result = JSON.parse(result)
            if (result?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage?.accountBlock, {}, {}));
            if (isVerifyToken?.userType != userType) return res.status(403).json(await apiResponse(403, responseMessage?.accessDenied, {}, {}));
            if (isVerifyToken.exp < new Date().getTime()) {
                return res.status(410).json(await apiResponse(410, responseMessage?.tokenExpire, {}, {}))
            }
            if (result?.isActive == true && isVerifyToken.authToken == result.authToken && isVerifyToken?.userType == result?.userType) {
                // Set in Header Decode Token Information
                req.headers.user = result
                return next()
            } else {
                return res.status(401).json(await apiResponse(401, responseMessage?.invalidToken, {}, {}))
            }
        } catch (err) {
            console.log(err)
            if (err.message == "invalid signature") return res.status(403).json(await apiResponse(403, responseMessage?.differentToken, {}, {}))
            return res.status(401).json(await apiResponse(401, responseMessage.invalidToken, {}, {}))
        }
    } else {
        return res.status(401).json(await apiResponse(401, responseMessage?.tokenNotFound, {}, {}))
    }
}

export const temporaryTokenGeneration = async ({ userId, authToken, userType, }: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = jwt.sign({
                _id: userId,
                authToken,
                userType,
                status: "Email Verification",
                generatedOn: (new Date().getTime())
            }, jwt_token_secret)
            resolve(token)
        } catch (error) {
            reject(error)
        }
    })
}

export const uploadJWT = async (req: Request, res: Response, next) => {
    let { authorization } = req.headers,
        result: any
    if (authorization) {
        try {
            let isVerifyToken = jwt.verify(authorization, jwt_token_secret)
            req.headers.user = isVerifyToken
            next()
        } catch (err) {
            if (err.message == "invalid signature") return res.status(403).json(await apiResponse(403, responseMessage?.differentToken, {}, {}))
            console.log(err)
            return res.status(401).json(await apiResponse(401, responseMessage.invalidToken, {}, {}))
        }
    } else {
        return res.status(401).json(await apiResponse(401, responseMessage?.tokenNotFound, {}, {}))
    }
}

export const loginTokenResponseGenerator = async (user: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = jwt.sign({
                _id: user._id,
                authToken: user.authToken,
                userType: user.userType,
                status: "Login",
                generatedOn: new Date().getTime(),
                exp: new Date().getTime() + (access_token_duration as any),
            }, jwt_token_secret)
            const refresh_token = jwt.sign({
                _id: user._id,
                generatedOn: new Date().getTime(),
                exp: new Date().getTime() + (access_token_duration as any),
            }, refresh_jwt_token_secret)
            await new userSessionModel({
                createdBy: user?._id,
                refresh_token
            }).save()
            resolve({
                error: false, data: {
                    _id: user._id,
                    userType: user.userType,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    image: user.image,
                    token, refresh_token,
                }
            })
        }
        catch (error) {
            console.log(error)
            resolve({ error: true, errorMessage: error })
        }
    })
}

export const lineDecodeJWT = async (token: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            let decodeResponse: any = await jwt.verify(token, line?.client_secret)
            resolve({
                error: false, data: decodeResponse
            })
        } catch (error) {
            console.log(error);
            resolve({
                error: true, data: error
            })
        }
    })
}

export const userJWTDecode = async (token: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            let decodeResponse: any = await jwt.verify(token, jwt_token_secret)
            resolve({
                error: false, data: decodeResponse
            })
        } catch (error) {
            console.log(error);
            resolve({
                error: true, data: error
            })
        }
    })
}

export const verifyGoogleToken = async (token, clientId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const client = new OAuth2Client(clientId);
            // Verify the token
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: clientId, // This should match your client ID
            });

            const payload = ticket.getPayload();
            // Extract user information from the payload

            return resolve({ error: false, data: payload });
        } catch (error) {
            // Token verification failed
            console.error('Token verification failed:', error.message);
            return resolve({ error: true, data: error });
        }
    })
}