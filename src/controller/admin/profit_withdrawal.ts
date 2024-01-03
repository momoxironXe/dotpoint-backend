"use strict"
import { logger, reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { closing_trading_position, disable_trading_account, get_open_position_trading_data, mt5_update_account_balance, payout_create, responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeUserModel, userModel } from '../../database'
import { apiResponse, challengeUserStatus } from '../../common'
import { profitWithdrawalModel } from '../../database/models/profit_withdrawal'
import config from 'config'

const ObjectId = Types.ObjectId;

const airwallex: any = config.get('airwallex')

export const get_list_profit_withdrawal = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, } = req.body,
        skip: number,
        match: any = { isActive: true, isBlock: false, isApproval: false },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        [response, count] = await Promise.all([
            profitWithdrawalModel.aggregate([
                { $match: match },
                { $sort: { title: 1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'userData',
                    },
                },
                { $unwind: { path: '$userData', preserveNullAndEmptyArrays: false } },
                { $project: { __v: 0, createdBy: 0, updatedBy: 0 } },
            ]),
            profitWithdrawalModel.countDocuments(match)
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('profit withdrawal list'), {
            profit_withdrawal_list_data: response,
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

export const payout_request = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        id = body?.id,
        user: any = req.header('user')
    delete body?.id
    body.updatedBy = user?._id
    try {
        let response = await profitWithdrawalModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, body, { new: true })
        if (response) return res.status(200).json(await apiResponse(200, responseMessage?.updateDataSuccess('approval'), response, {}));
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('approval'), {}, `${response}`));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const payout = async (req: Request, res: Response) => {
    reqInfo(req)
    const { id } = req.params
    let body = req.body,
        user: any = req.header('user')
    try {
        let userData = await userModel.findOne({ _id: new ObjectId(id), isActive: true, isBlock: false })
        if (!userData) return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}));

        let withdrawalData: any = await profitWithdrawalModel.findOne({ createdBy: new ObjectId(userData?._id), isActive: true, isBlock: false })
        if (!withdrawalData) return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('withdrawal request'), {}, {}));

        let challengeUserData: any = await challengeUserModel.findOne({ createdBy: new ObjectId(userData?._id), _id: new ObjectId(withdrawalData?.challengeUserId), isActive: true, isBlock: false })
        if (!challengeUserData) return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}));

        // console.log('withdrawalData :>> ',userData, withdrawalData , challengeUserData);

        const data = {
            city: userData.city,
            country_code: userData.countryCode1?.toUpperCase(),
            postcode: userData.postalCode,
            state: userData.state,
            street_address: userData.street,
            account_currency: challengeUserData?.currencyCode,
            account_name: `${userData.firstName} ${userData.lastName}`,
            account_number: withdrawalData?.accountNumber,
            bank_country_code: userData?.countryCode1.toUpperCase(),
            bank_name: withdrawalData?.bankName,
            ifscCode: withdrawalData?.ifscCode,
            email: challengeUserData?.billingInfo?.email,
            payment_currency: challengeUserData?.currencyCode,
            payment_amount: challengeUserData?.amount,
        }

        let paymentResponse: any = await payout_create(data)

        if (paymentResponse?.error) {
            return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Technical error happen in payout airwallex'), {}, paymentResponse?.data));
        }
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('payout'), paymentResponse?.data, {}));
    } catch (error) {
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const reset_account = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        user: any = req.header('user')
    try {
        let userData = await userModel.findOne({ _id: new ObjectId(body?.userId), isActive: true, isBlock: false })
        if (!userData) return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}));

        // let withdrawalData: any = await profitWithdrawalModel.findOne({ createdBy: new ObjectId(userData?._id), isActive: true, isBlock: false })
        // if (!withdrawalData) return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('withdrawal request'), {}, {}));

        let challengeUserData: any = await challengeUserModel.findOne({ createdBy: new ObjectId(userData?._id), _id: new ObjectId(body?.challengeId), isActive: true, isBlock: false },)
        if (!challengeUserData) return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}));

        let openTradingPosition: any = await get_open_position_trading_data({ accountId: challengeUserData.accountId })

        if (!openTradingPosition?.error) {
            await Promise.all(openTradingPosition?.data?.map(async (onePositionData) => {
                logger.debug(`AccountId : ${challengeUserData.accountId} PositionId : ${onePositionData?.id}`)
                let positionResponse: any = await closing_trading_position({ accountId: challengeUserData.accountId, positionId: onePositionData?.id })
                if (positionResponse?.data?.stringCode == 'TRADE_RETCODE_TRADE_DISABLED') {
                    await closing_trading_position({ accountId: challengeUserData.accountId, positionId: onePositionData?.id })
                }
            }))
        }

        let difference = challengeUserData.accountBalance - challengeUserData.currentBalance;
        const bodyData = {
            login: challengeUserData.login,
            amount: difference
        }
        const response: any = await mt5_update_account_balance(bodyData)
        if (response?.error) {
            return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Technical error happen in account reset successfully'), {}, response?.data));
        }
        await challengeUserModel.updateOne({ createdBy: new ObjectId(userData?._id), _id: new ObjectId(body?.challengeId), isActive: true, isBlock: false }, { $set: { status: challengeUserStatus?.running } })
        await disable_trading_account({ login: challengeUserData.login, trading: true }) // also reactivate the account
        res.status(200).json(await apiResponse(200, responseMessage?.customMessage('Account reset successfully'), response?.data, {}));
    } catch (error) {
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}