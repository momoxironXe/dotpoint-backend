"use strict";
import { Request, Response } from 'express';
import mongoose from "mongoose";
import { customerSupportModel } from "../../database/models/customer_support";
import { reqInfo, responseMessage } from "../../helper";
import { apiResponse } from '../../common';

export const get_list_customer_support = async (req: Request, res: Response) => {
  reqInfo(req)
  let { limit, page, } = req.body,
    skip: number,
    match: any = { isActive: true, isBlock: false },
    response: any, count: number
  limit = parseInt(limit)
  skip = ((parseInt(page) - 1) * parseInt(limit))
  try {

    [response, count] = await Promise.all([
      customerSupportModel.aggregate([
        { $match: match },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'customerData',
          },
      },
        { $project: { __v: 0, createdBy: 0 } },
      ]),
      customerSupportModel.countDocuments(match)
    ])
    return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('customer support list'), {
      customer_support_list_data: response,
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