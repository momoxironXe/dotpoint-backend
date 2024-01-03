"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { deleteCache, responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeListModel, challengeApprovalModel, currencyListModel, userModel, challengeUserModel } from '../../database'
import { apiResponse, challengeApprovalStatus } from '../../common'
import { paymentWithdrawModel } from '../../database/models/payment_withdraw'

const ObjectId = Types.ObjectId

export const add_challenge_approval = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        user: any = req.header('user')
    body.createdBy = user?._id
    let isValidRequest = true
    let updateObject: any = {}
    try {
        let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(body?.challengeUserId), isActive: true, isBlock: false })
        if (!challengeUserData)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
        await Promise.all(user?.tradingAccounts?.map(async (one_account) => {
            if (body?.accountId == one_account?.accountId && body?.login == one_account?.login) {
                if (body?.isStep1) {
                    if (!one_account?.step1Completed)
                        isValidRequest = false
                    else
                        updateObject["tradingAccounts.$.step1Status"] = 0
                }
                if (body?.isStep2) {
                    if (!one_account?.step2Completed)
                        isValidRequest = false
                    else
                        updateObject["tradingAccounts.$.step2Status"] = 0
                }
            }
        }))
        if (!isValidRequest)
            return res.status(400).json(await apiResponse(400, responseMessage.customMessage(`First complete your challenge`), {}, {}));
        let isAlready: any = await challengeApprovalModel.findOne({ createdBy: user?._id, isActive: true, isBlock: false, status: { $nin: [challengeApprovalStatus?.rejected,], }, isStep1: body?.isStep1, isStep2: body?.isStep2, accountId: body?.accountId, login: body?.login, challengeUserId: new ObjectId(body?.challengeUserId), })
        if (isAlready) return res.status(400).json(await apiResponse(400, responseMessage.customMessage("challenge approval you've already submitted!"), {}, {}));
        let response = await new challengeApprovalModel(body).save()
        await Promise.all(user?.tradingAccounts?.map(async (one_account) => {
            if (body?.accountId == one_account?.accountId && body?.login == one_account?.login) {
                if (body?.step1Completed && !body?.step2Completed) {
                    updateObject["tradingAccounts.$.step1ApprovalId"] = response?._id
                }
                if (body?.step1Completed && body?.step2Completed) {
                    updateObject["tradingAccounts.$.step2ApprovalId"] = response?._id
                }
            }
        }))
        await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, "tradingAccounts.accountId": body?.accountId, "tradingAccounts.login": body?.login, }, { $set: updateObject })
        await deleteCache(`${user?._id}`)
        return res.status(200).json(await apiResponse(200, responseMessage.addDataSuccess('challenge approval'), response, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const get_challenge_approval_list_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, riskModeOption } = req.body,
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (riskModeOption != null || riskModeOption != undefined)
            match.riskModeOption = riskModeOption;
        [response, count] = await Promise.all([
            challengeApprovalModel.aggregate([
                { $match: match },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
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
                            { $project: { firstName: 1, lastName: 1, image: 1 } },
                        ],
                        as: "userData"
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