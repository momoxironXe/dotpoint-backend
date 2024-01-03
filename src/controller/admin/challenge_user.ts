"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeUserModel } from '../../database'
import { apiResponse } from '../../common'

const ObjectId = Types.ObjectId

export const get_challenge_users_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, search, } = req.body, nameArray: any = [],
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (search && search != "") {
            search = search.split(" ")
            await search.forEach(data => {
                nameArray.push({ "login": { $regex: data, $options: 'si' } })
                nameArray.push({ "userData.firstName": { $regex: data, $options: 'si' } })
                nameArray.push({ "userData.lastName": { $regex: data, $options: 'si' } })
            })
        };
        [response, count] = await Promise.all([
            challengeUserModel.aggregate([
                { $match: match },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'userData',
                    },
                },
                { $unwind: { path: '$userData', preserveNullAndEmptyArrays: false } },
                {
                    $match: nameArray?.length > 0 ? {
                        $or: nameArray
                    } : {}
                },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'challenge_lists',
                        localField: 'challengeListId',
                        foreignField: '_id',
                        as: 'challengeData',
                    },
                },
            ]),
            challengeUserModel.countDocuments(match)
        ])

        const tempData = await Promise.all(response.map((ele: any) => {
            return {
                ...ele,
                tradingAccountData: ele?.userData?.tradingAccounts?.find((account: any) => account?.accountId == ele?.accountId)
            }
        }))
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('challenge list'), {
            challenge_user_data: tempData,
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