"use strict"
import { Request, Response } from 'express'
import { create_payment_checkout_coinbase, responseMessage, } from '../../helper'
import { airwallexPaymentStatus, apiResponse, challengeUserPaymentStatus, getCurrencyDetails, paymentAmountFormat } from '../../common'
import { challengeListModel, challengeUserModel, coinbaseModel, currencyListModel, userModel } from '../../database'
import { Types } from 'mongoose'
import config from 'config'
import { payment_paid_after_remaining_operation_in_challenge } from './airwallex'

var Webhook = require('coinbase-commerce-node').Webhook;
const coinbase: any = config.get('coinbase')
const ObjectId = Types.ObjectId

export const create_payment_coinbase_link_of_challenge_list = async (req: Request, res: Response) => {
  let user: any = req.header('user')
  try {
    const { challengeUserId } = req.body
    const challengeUserData: any = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) })
    if (!challengeUserData)
      return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge user"), {}, {}))
    const currencyListData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData?.currencyListId), isActive: true, isBlock: false, })
    if (!currencyListData)
      return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge list"), {}, {}))
    const challengeListData: any = await challengeListModel.findOne({ _id: new ObjectId(challengeUserData?.challengeListId), isActive: true, isBlock: false, })
    if (!challengeListData)
      return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge list"), {}, {}))

    if (challengeUserData?.paymentStatus == challengeUserPaymentStatus?.completed)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment is already completed"), {}, {}))
    const paymentResponse: any = await create_payment_checkout_coinbase({ userId: user?._id, userName: `${user?.firstName} ${user?.lastName}`, amount: challengeUserData?.amount, name: "Challenge Payment", description: `${paymentAmountFormat(challengeUserData?.accountBalance)} ${getCurrencyDetails(challengeUserData?.currencyCode)?.currencySymbol} ${challengeListData?.name || 'Challenge'}`, currency: challengeUserData?.currencyCode, challengeUserId, })
    if (paymentResponse?.error)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), {}, paymentResponse?.data))
    await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false }, { coinbaseEvenId: paymentResponse?.data?.data?.id })
    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("Payment Intent Create"), paymentResponse?.data?.data, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const coinbase_success_payment = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    console.log(req.query);
    return res.status(200).json(await apiResponse(200, responseMessage?.paymentSuccess, {}, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const coinbase_cancel_payment = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    console.log(req.query);
    return res.status(200).json(await apiResponse(200, responseMessage?.paymentFailed, {}, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const coinbase_webhook_payment = async (req: any, res: Response) => {
  try {
    let { event } = req.body
    // let event: any = await Webhook.verifyEventBody(
    //   req.body,
    //   req.headers['x-cc-webhook-signature'],
    //   coinbase?.api_key
    // );
    if (event.type === 'charge:confirmed') {
      await new coinbaseModel({ eventData: event }).save()
      let { challengeUserId, userId } = event.data.metadata
      let [challengeUserData, userData] = await Promise.all([
        challengeUserModel.findOneAndUpdate({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false }, { coinbaseEvenId: event?.id }),
        userModel.findOne({ _id: new ObjectId(userId), isActive: true, isBlock: false }),
      ])
      console.log("challengeUserData ", challengeUserData);
      console.log("userData ", userData);
      if (challengeUserData && userData) {
        console.log('CONDITION MATCHED');
        await payment_paid_after_remaining_operation_in_challenge(challengeUserData, { data: { status: airwallexPaymentStatus?.unpaid } }, userData)
      }
    }
    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage('Coinbase webhook successfully received'), {}, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}