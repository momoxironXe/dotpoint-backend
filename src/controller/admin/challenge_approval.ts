"use strict"
import { logger, reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { closing_trading_position, deleteCache, disable_trading_account, get_open_position_trading_data, mt4_update_account_balance, mt5_update_account_balance, responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeListModel, challengeApprovalModel, currencyListModel, userModel, challengeUserModel } from '../../database'
import { apiResponse, challengeApprovalStatus, challengeUserStatus } from '../../common'
import { paymentWithdrawModel } from '../../database/models/payment_withdraw'
import moment from 'moment'
import { account_creation_of_step_2 } from '../user'

const ObjectId = Types.ObjectId

export const update_challenge_approval = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        id = body?.id, returnMessage = responseMessage?.updateDataSuccess('challenge approval'),
        user: any = req.header('user')
    delete body?.id
    body.updatedBy = new ObjectId(user?._id)
    try {
        let response = await challengeApprovalModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, body, { new: true })
        if (response) {
            let userData = await userModel.findOne({ _id: new ObjectId(response?.createdBy), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": String(response?.challengeUserId), }, { "tradingAccounts.$": 1, firstName: 1, lastName: 1, phoneNumber: 1, email: 1, })
            if (userData)
                userData = JSON.parse(JSON.stringify(userData))
            if (body?.status != null) {

                if (body?.status == challengeApprovalStatus?.approved)
                    returnMessage = `You'r requested challenge step has been approved`
                if (body?.status == challengeApprovalStatus?.rejected)
                    returnMessage = `You'r requested challenge step has been rejected`
                let tradingAccounts: any = userData?.tradingAccounts[0]
                if (response?.isStep1) {
                    tradingAccounts.step1Status = body?.status == challengeApprovalStatus?.approved ? challengeApprovalStatus?.approved : body?.status == challengeApprovalStatus?.rejected ? challengeApprovalStatus?.rejected : challengeApprovalStatus?.pending

                    if (body?.status == challengeApprovalStatus?.approved) {
                        let challengeUserData: any = await challengeUserModel.findOne({ _id: new ObjectId(tradingAccounts?.challengeUserId), isActive: true, isBlock: false })
                        let currencyListData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData?.currencyListId), isActive: true, isBlock: false })
                        await userModel.updateOne({ _id: new ObjectId(challengeUserData?.createdBy), isActive: true, isBlock: false, "tradingAccounts._id": new ObjectId(tradingAccounts?._id), }, {
                            $set: {
                                "tradingAccounts.$.step1Completed": true, "tradingAccounts.$.step1Status": challengeApprovalStatus?.approved, "tradingAccounts.$.step1ApprovalId": response?._id, "tradingAccounts.$.login": null, "tradingAccounts.$.password": null, "tradingAccounts.$.investorPassword": null, "tradingAccounts.$.accountId": null, "tradingAccounts.$.currentAccountBalance": 0,
                            }
                        })
                        let openTradingPosition: any = await get_open_position_trading_data({ accountId: challengeUserData.accountId })
                        if (!openTradingPosition?.error) {
                            await Promise.all(openTradingPosition?.data?.map(async (onePositionData) => {
                                logger.debug(`AccountId : ${challengeUserData.accountId} PositionId : ${onePositionData?.id}`)
                                let positionResponse: any = await closing_trading_position({ accountId: challengeUserData.accountId, positionId: onePositionData?.id })
                                if (positionResponse?.data?.stringCode == 'TRADE_RETCODE_TRADE_DISABLED') {
                                    await disable_trading_account({ login: challengeUserData?.login, trading: true })
                                    await closing_trading_position({ accountId: challengeUserData.accountId, positionId: onePositionData?.id })
                                }
                            }))
                        }
                        await disable_trading_account({ login: challengeUserData?.login, trading: false })
                        // await remove_trading_account(challengeUserData?.accountId)
                        await account_creation_of_step_2({ challengeUserData, currencyListData, user: userData })
                    }
                }
                if (response?.isStep2) {
                    tradingAccounts.step2Status = body?.status == challengeApprovalStatus?.approved ? challengeApprovalStatus?.approved : body?.status == challengeApprovalStatus?.rejected ? challengeApprovalStatus?.rejected : challengeApprovalStatus?.pending
                    if (body?.status == challengeApprovalStatus?.approved) {
                        await challengeUserModel.updateOne({ _id: new ObjectId(tradingAccounts?.challengeUserId), isActive: true, isBlock: false }, { endChallengeDate: null, status: challengeUserStatus?.completed })
                    }
                }
            }

            return res.status(200).json(await apiResponse(200, returnMessage, response, {}));
        }
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge approval'), {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_challenge_approval_list_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, search, } = req.body, nameArray: any = [],
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (search && search != "") {
            search = search.split(" ")
            await search.forEach(data => {
                nameArray.push({ firstName: { $regex: data, $options: 'si' } })
                nameArray.push({ lastName: { $regex: data, $options: 'si' } })
                nameArray.push({ phoneNumber: { $regex: data, $options: 'si' } })
                nameArray.push({ email: { $regex: data, $options: 'si' } })
            })
        };
        [response, count] = await Promise.all([
            challengeApprovalModel.aggregate([
                { $match: match },
                { $sort: { _id: -1 } },
                {
                    $lookup: {
                        from: "users",
                        let: { createdBy: '$createdBy' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$_id', '$$createdBy'] },
                                            { $eq: ['$isActive', true] },
                                            { $eq: ['$isBlock', false] },
                                        ],
                                    },
                                }
                            },
                            {
                                $match: nameArray?.length > 0 ? {
                                    $or: nameArray
                                } : {}
                            },
                            { $project: { firstName: 1, lastName: 1, image: 1, email: 1 } },
                        ],
                        as: "userData"
                    }
                },
                { $unwind: { path: '$userData', preserveNullAndEmptyArrays: false } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "challenge_users",
                        let: { challengeUserId: '$challengeUserId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$_id', '$$challengeUserId'] },
                                            { $eq: ['$isActive', true] },
                                            { $eq: ['$isBlock', false] },
                                        ],
                                    },
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
                            { $project: { isBlock: 0, __v: 0, } },
                        ],
                        as: "challengeUser"
                    }
                },
                { $project: { __v: 0 } },
            ]),
            challengeApprovalModel.countDocuments(match)
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('challenge approval'), {
            challenge_approval: response,
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