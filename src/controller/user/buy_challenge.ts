"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeListModel, challengeUserModel, currencyListModel, userModel } from '../../database'
import { apiResponse, userType } from '../../common'

const ObjectId = Types.ObjectId

export const buy_challenge = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body, isMatchTradingCurrency = false, isCurrencyListMatch = false,
        user: any = req.header('user')
    body.createdBy = user?._id
    try {
        // if (!user?.country || !user?.city || !user?.email || !user?.firstName || !user?.lastName || !user?.phoneNumber || !user?.postalCode || !user?.state || !user?.city) {
        //     return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("First fill your account details"), {}, {}))
        // }
        if (!body?.billingInfo?.country || !body?.billingInfo?.city || !body?.billingInfo?.email || !body?.billingInfo?.firstName || !body?.billingInfo?.lastName || !body?.billingInfo?.postalCode || !body?.billingInfo?.city) {
            return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("First fill your billing info details"), {}, {}))
        }
        // let isAlready: any = await challengeUserModel.findOne({ challengeListId: body.challengeListId, createdBy: user?._id, isActive: true, isBlock: false })
        let challengeListData: any = await challengeListModel.findOne({ _id: new ObjectId(body.challengeListId), isActive: true, isBlock: false })
        if (!challengeListData) return res.status(404).json(await apiResponse(404, responseMessage.getDataNotFound("challenge list"), {}, {}))

        let currencyExist: any = await currencyListModel.findOne({ _id: new ObjectId(body.currencyListId), isActive: true, isBlock: false })
        if (!currencyExist) return res.status(404).json(await apiResponse(404, responseMessage.getDataNotFound("currency list"), {}, {}))
        // if (isAlready) return res.status(409).json(await apiResponse(409, responseMessage.customMessage("buy challenge is already exit"), {}, {}));
        body.maximumDayLoss = challengeListData?.maximumDayLoss
        body.minimumTradingDays = challengeListData?.minimumTradingDays
        body.tradingPeriodDays = challengeListData?.tradingPeriodDays
        if (challengeListData?.tradingCurrency?.length == 0) return res.status(400).json(await apiResponse(400, responseMessage.customMessage("This challenge has no trading currency left"), {}, {}))

        for (let oneTradingCurrency of challengeListData?.tradingCurrency) {
            if (oneTradingCurrency?.buyChallengeCurrency?.length > 0) {
                if ((oneTradingCurrency?.currencyListId).toString() == body?.currencyListId) {
                    isCurrencyListMatch = true
                    for (let oneBuyCurrency of oneTradingCurrency?.buyChallengeCurrency) {
                        if (oneBuyCurrency?.currency == body?.currencyCode) {
                            isMatchTradingCurrency = true
                            body.amount = oneBuyCurrency.amount
                            body.accountBalance = oneTradingCurrency.accountBalance
                            body.maximumLoss = oneTradingCurrency.maximumLoss
                            body.profitTarget = oneTradingCurrency.profitTarget
                            body.maximumDayLoss = oneTradingCurrency.maximumDayLoss
                            // if (body?.amount == oneBuyCurrency.amount) {
                            //     isMatchTradingCurrencyAmount = true
                            // }
                        }
                    }
                }

            }
        }

        if (!isCurrencyListMatch) {
            return res.status(404).json(await apiResponse(404, responseMessage.getDataNotFound("currency list in challenge list"), {}, {}))
        }
        if (!isMatchTradingCurrency) {
            return res.status(400).json(await apiResponse(400, responseMessage.customMessage("selected amount currency not available for making payment"), {}, {}))
        }
        let userData = await userModel.findById(user?._id)
        let tempBody = {
            firstName: userData?.firstName ? userData.firstName : body.billingInfo.firstName,
            lastName: userData?.lastName ? userData.lastName : body.billingInfo.lastName,
            phoneNumber: userData?.phoneNumber ? userData.phoneNumber : body.billingInfo.contactNumber,
            countryCode: userData?.countryCode ? userData.countryCode : body.billingInfo.countryCode,
            email: userData?.email ? userData.email : body.billingInfo.email,
            city: userData?.city ? userData.city : body.billingInfo.city,
            street: userData?.street ? userData.street : body.billingInfo.street,
            postalCode: userData?.postalCode ? userData.postalCode : body.billingInfo.postalCode,
            country: userData?.country ? userData.country : body.billingInfo.country,
            state: userData?.state ? userData.state : body.billingInfo.state
        }
        await userModel.findOneAndUpdate({ _id: new ObjectId(user?._id), isActive: true, isBlock: false }, tempBody, { new: true })
        // if (!isMatchTradingCurrencyAmount) {
        //     return res.status(400).json(await apiResponse(400, responseMessage.customMessage("Your requested currency amount for payment is not matching; please retry it"), {}, {}))
        // }
        let response = await new challengeUserModel(body).save()
        return res.status(200).json(await apiResponse(200, responseMessage.addDataSuccess('buy challenge'), response, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const get_buy_challenge_list_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, riskModeOption } = req.body,
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, createdBy: new ObjectId(user?._id), paymentStatus: 1 },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (riskModeOption != null || riskModeOption != undefined)
            match.riskModeOption = riskModeOption;
        [response, count] = await Promise.all([
            challengeUserModel.aggregate([
                { $match: match },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
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
                {
                    $lookup: {
                        from: 'currency_lists',
                        localField: 'currencyListId',
                        foreignField: '_id',
                        as: 'currencyData',
                    },
                },
                { $project: { __v: 0 } },
            ]),
            challengeUserModel.countDocuments(match)
        ])
        response = JSON.parse(JSON.stringify(response))
        user = JSON.parse(JSON.stringify(user))
        await Promise.all(response?.map(async (data) => {
            await Promise.all(user?.tradingAccounts?.map(async (one_account) => {
                if (data?._id == one_account?.challengeUserId) {
                    data.tradingAccount = one_account
                }
            }))
        }))
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('buy challenge list'), {
            buy_challenge_list_data: response,
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

export const get_buy_challenge_by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    let user = req.header('user') as any
    try {
        let challengeUser = await challengeUserModel.findOne({ _id: new ObjectId(req.params.id), isActive: true }, { updatedAt: 0, __v: 0 })
        if (!challengeUser)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('get buy challenge'), {}, {}))

        challengeUser = JSON.parse(JSON.stringify(challengeUser))
        let tradingAccount = user?.tradingAccounts.find((el: any) => el.challengeUserId == challengeUser._id)
        let data = {
            ...challengeUser,
            tradingAccounts: tradingAccount,
            login: tradingAccount?.login,
        }
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('get buy challenge'), data, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_buy_challenge_leader_board = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page } = req.body,
        skip: number,
        match: any = { isActive: true, isBlock: false, userType: userType?.user },
        response: any, count: number;
    limit = parseInt(limit);
    skip = ((parseInt(page) - 1) * parseInt(limit));

    try {
        [response, count] = await Promise.all([
            userModel.aggregate([
                { $match: match },
                { $sort: { calculationFinalAmount: -1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { __v: 0 } },
            ]),
            userModel.countDocuments(match)
        ]);
        response = response.map((doc: any, index: number) => ({ ...doc, index: skip + index + 1 }));
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('leader board list'), {
            leaderData: response,
            state: {
                page,
                limit,
                page_limit: Math.ceil(count / limit),
                data_count: count
            }
        }, {}));
    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
};