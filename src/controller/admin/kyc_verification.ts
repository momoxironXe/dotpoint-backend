"use strict"
import { reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { responseMessage } from '../../helper'
import { Types } from 'mongoose'
import { challengeUserModel, userModel } from '../../database'
import { apiResponse, challengeApprovalStatus } from '../../common'
import { kycVerificationModel } from '../../database/models/kyc_verification'
import axios from 'axios'

const ObjectId = Types.ObjectId

export const get_kyc_verification_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let { limit, page, search } = req.body, nameArray: any = [],
        user = req.header('user') as any,
        skip: number,
        match: any = { isActive: true, isBlock: false, status: { $ne: null } },
        response: any, count: number
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
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
        [response, count] = await Promise.all([
            kycVerificationModel.aggregate([
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
                                $match: nameArray?.length >0? {
                                    $or: nameArray
                                }:{}
                            },
                            { $project: { firstName: 1, lastName: 1, image: 1, email: 1 } },
                        ],
                        as: "userData"
                    }
                },
                { $unwind: { path: '$userData', preserveNullAndEmptyArrays: false } },
                { $skip: skip },
                { $limit: limit },
            ]),
            kycVerificationModel.countDocuments(match)
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('kyc'), {
            kyc_verification_data: response,
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

export const get_kyc_verification_id = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let kycData = await kycVerificationModel.findOne({ _id: new ObjectId(req.params.id), isActive: true }, { updatedAt: 0, __v: 0 })
        if (!kycData)
            return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('kyc verification'), {}, {}))
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('kyc verification'), kycData, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const update_kyc_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        id = body?.id, returnMessage = responseMessage?.updateDataSuccess('kyc'),
        user: any = req.header('user')
    delete body?.id
    body.updatedBy = new ObjectId(user?._id)
    try {
        let response = await kycVerificationModel.findOneAndUpdate({ _id: new ObjectId(id), isActive: true, isBlock: false }, body, { new: true })
        if (response) {
            if (body?.status != null) {
                if (body?.status == challengeApprovalStatus?.approved) {
                    returnMessage = `You'r requested kyc has been approved`
                    await userModel.updateOne({ _id: new ObjectId(response?.createdBy), isActive: true, isBlock: false }, { isKYCVerified: true })
                }
                if (body?.status == challengeApprovalStatus?.rejected)
                    returnMessage = `You'r requested kyc has been rejected`
            }
            return res.status(200).json(await apiResponse(200, returnMessage, response, {}));
        }
        else return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('kyc'), {}, {}));
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}