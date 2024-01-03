"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { deleteCache, responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeListModel, challengeUserModel, profitWithdrawalModel, userModel } from '../../database'
import { apiResponse, userType } from '../../common'
import bcryptjs from 'bcryptjs'

const ObjectId = Types.ObjectId

export const unblock_block = async (req: Request, res: Response) => {
    reqInfo(req)
    let user = req.header('user'), { id, isBlock } = req.body
    try {
        let userIsExist = await userModel.findOne({ _id: new ObjectId(id), isActive: true })
        if (!userIsExist)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}))
        userIsExist = await userModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true }, { isBlock }, { new: true })
        await deleteCache(`${userIsExist?._id}`)
        if (userIsExist?.isBlock)
            return res.status(200).json(await apiResponse(200, responseMessage?.customMessage('Your requested user has been blocked'), {}, {}))
        else return res.status(200).json(await apiResponse(200, responseMessage?.customMessage('Your requested user has been unblocked'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const update_user = async (req: Request, res: Response) => {
    reqInfo(req)
    let user = req.header('user')
    try {
        let [emailIsAlreadyAssign]: any = await Promise.all([
            userModel.findOne({ _id: { $ne: new ObjectId(req.body?.id) }, email: req.body?.email, isActive: true, userType: userType?.user },)
        ])
        if (emailIsAlreadyAssign)
            return res.status(400).json(await apiResponse(400, responseMessage?.dataAlreadyExist('email address'), {}, {}))
        let updatedData: any = userModel.findOneAndUpdate({ _id: new ObjectId(req.body?.id), isActive: true }, req.body, { new: true })
        await deleteCache(`${updatedData?._id}`)
        if (!updatedData)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}))

        return res.status(200).json(await apiResponse(200, responseMessage?.updateDataSuccess('user'), updatedData, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const get_user_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, isBlock, search, sortDate, } = req.body,
        user = req.header('user') as any,
        skip: number, sort: any = { _id: -1 },
        match: any = { isActive: true, userType: userType?.user },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (sortDate == 1) {
            sort = { _id: 1 }
        }
        if (search && search != "") {
            let nameArray: Array<any> = []
            search = search.split(" ")
            await search.forEach(data => {
                nameArray.push({ firstName: { $regex: data, $options: 'si' } })
                nameArray.push({ lastName: { $regex: data, $options: 'si' } })
                nameArray.push({ phoneNumber: { $regex: data, $options: 'si' } })
                nameArray.push({ email: { $regex: data, $options: 'si' } })
            })
            match.$or = nameArray;
        };

        if (isBlock != null && isBlock != undefined)
            match.isBlock = isBlock;
        [response, count] = await Promise.all([
            userModel.aggregate([
                { $match: match },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
                {
                    $addFields: {
                        totalTradingBalance: { $sum: "$tradingAccounts.currentAccountBalance" }
                    }
                },
                { $project: { __v: 0, password: 0, authToken: 0, otp: 0, otpExpireTime: 0, accountSuspensionDate: 0, deviceToken: 0 } },
            ]),
            userModel.countDocuments(match)
        ])
        await Promise.all(response?.map(async (one_user) => {
            await Promise.all(one_user?.tradingAccounts?.map(async (one_trading_account) => {
                let challengeData = await challengeUserModel.aggregate([
                    { $match: { _id: new ObjectId(one_trading_account?.challengeUserId), isActive: true } },
                    {
                        $lookup: {
                            from: "challenge_lists",
                            let: { challengeListId: '$challengeListId' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$_id', '$$challengeListId'] },
                                                { $eq: ['$isActive', true] },
                                                { $eq: ['$isBlock', false] },
                                            ],
                                        },
                                    }
                                },
                                { $project: { name: 1, description: 1, } },
                            ],
                            as: "challenge_list"
                        }
                    },
                    { $project: { challengeName: { $first: "$challenge_list.name" }, status: 1 } }
                ],)
                one_trading_account.challengeUserData = challengeData[0] || { challengeName: "N/A", status: null }
            }))
        })
        )
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('user'), {
            user_data: response,
            state: {
                page,
                limit,
                page_limit: Math.ceil(count / limit), data_count: count
            }
        }, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const add_user = async (req: Request, res: Response) => {
    reqInfo(req)
    let user = req.header('user'), body = req.body,
        authToken = 0

    try {
        let isAlready: any = await userModel.findOne({ email: body.email, isActive: true, isBlock: false })
        if (isAlready?.isBlock == true) return res.status(403).json(await apiResponse(403, responseMessage.accountBlock, {}, {}));
        if (isAlready) return res.status(409).json(await apiResponse(409, responseMessage.alreadyEmail, {}, {}));
        const salt = await bcryptjs.genSaltSync(10)
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
        body.userType = userType?.user
        let response = await new userModel(body).save()
        return res.status(200).json(await apiResponse(200, responseMessage.addDataSuccess('user'), {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const get_user_by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let user = await userModel.findOne({ _id: new ObjectId(req.params.id), isActive: true }, { password: 0, authToken: 0, otp: 0, otpExpireTime: 0, deviceToken: 0, accountSuspensionDate: 0, updatedAt: 0, __v: 0 })
        if (!user)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}))
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('user'), user, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const dashboard_get = async (req: Request, res: Response) => {
    reqInfo(req)
    let { } = req.body,
        user = req.header('user') as any,
        userMatch: any = { isActive: true, userType: userType?.user }

    try {
        const [userData, userCount, newChallengeCount, fundedTaddersCount, paidToFundedTaddersCount, economics] = await Promise.all([
            userModel.find(userMatch),
            userModel.countDocuments(userMatch),
            challengeListModel.countDocuments(),
            profitWithdrawalModel.countDocuments(),
            profitWithdrawalModel.countDocuments(),
            userModel.aggregate([
                // { $match: userMatch },
                { $project: { firstName: 1, createdAt: 1 } },
            ]),
        ]);
        const [step1CompletedCount, step2CompletedCount] = await Promise.all([
            userData.reduce((count, user) => { return count + user.tradingAccounts.filter(account => account.step1Completed).length }, 0),
            userData.reduce((count, user) => { return count + user.tradingAccounts.filter(account => account.step2CompletedCount).length }, 0)
        ]);
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('user'), {
            user: userCount,
            new_challenge: newChallengeCount,
            funded_tadders: fundedTaddersCount,
            paid_to_funded_tadders: paidToFundedTaddersCount,
            passed_first_challenge: step1CompletedCount,
            passed_secound_challenge: step2CompletedCount,
            economics: economics
        }, {}))
    } catch (error) {
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}