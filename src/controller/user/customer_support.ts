"use strict";
import { Request, Response } from 'express';
import mongoose from "mongoose";
import { customerSupportModel } from "../../database/models/customer_support";
import { reqInfo, responseMessage } from "../../helper";
import { apiResponse } from '../../common';

export const customer_support = async (req: Request, res: Response) => {
  reqInfo(req)
  let body = req.body, user = req.header('user') as any
  try {
    body.createdBy = user?._id
    const response = await new customerSupportModel(body).save()
    return res.status(200).json(await apiResponse(200, responseMessage?.addDataSuccess('customer support'), response, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
};