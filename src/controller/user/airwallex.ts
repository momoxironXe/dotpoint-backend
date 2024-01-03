"use strict"
import { Request, Response } from 'express'
import { confirm_payment_airwallex, create_meta_trader4, create_meta_trader5, create_payment_airwallex, create_payment_link_airwallex, deleteCache, logger, metaTraderAccountIds, metaTraderServerURLs, mt4_update_account_balance, mt5_update_account_balance, reqInfo, responseMessage, retrieved_payment_airwallex_link } from '../../helper'
import { airwallexPaymentStatus, apiResponse, challengeUserPaymentStatus, challengeUserStatus, getCurrencyDetails, paymentAmountFormat } from '../../common'
import { challengeListModel, challengeUserModel, currencyListModel, userModel } from '../../database'
import { Types } from 'mongoose'
import { MT4_creation, MT5_creation } from './meta_trader'
import { get_profile_calculation } from './authentication'
import { mailSend } from '../../helper/mailsend'
import { orderConfirmationTemplate } from '../../helper/verificationEmail'

const ObjectId = Types.ObjectId

export const airwallex_payment_webhook = async (req: Request, res: Response) => {
  try {
    const { data } = req.body
    if (data?.object?.id) {
      let challengeUserData = await challengeUserModel.findOne({ isActive: true, isBlock: false, airwallexPaymentLinkId: data?.object?.id })
      if (challengeUserData) {
        let user: any = await userModel.findOne({ _id: new ObjectId(challengeUserData?.createdBy), isActive: true, isBlock: false })
        await payment_paid_after_remaining_operation_in_challenge(challengeUserData, data?.object, user)
      }
    }
    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("Payment Intent Create"), {}, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const create_payment_airwallex_intent = async (req: Request, res: Response) => {
  try {
    const { amount, currency } = req.body
    const paymentResponse: any = await create_payment_airwallex({ amount, currency })
    if (paymentResponse?.error)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), paymentResponse?.data, {}))
    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("Payment Intent Create"), paymentResponse?.data, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const confirm_payment_airwallex_intent = async (req: Request, res: Response) => {
  let user: any = req.header('user')
  try {
    const { intentId, card, } = req.body
    const paymentResponse: any = await confirm_payment_airwallex({ intentId, card, airWallexUserId: user?.airWallexUserId })
    if (paymentResponse?.error)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), paymentResponse?.data, {}))
    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("Payment Intent Create"), paymentResponse?.data, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const create_payment_airwallex_link = async (req: Request, res: Response) => {
  let user: any = req.header('user')
  reqInfo(req)
  try {
    const { amount, currency } = req.body
    const paymentResponse: any = await create_payment_link_airwallex({ userId: user?._id, amount, title: "Challenge subscription", airWallexUserId: user?.airWallexUserId, currency })
    if (paymentResponse?.error)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), {}, paymentResponse?.data))
    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("Payment Intent Create"), paymentResponse?.data, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const create_payment_airwallex_link_of_challenge_list = async (req: Request, res: Response) => {
  reqInfo(req)
  let user: any = req.header('user'), isMatchTradingCurrency = false, isMatchTradingCurrencyAmount = false, actualChallengeAmount = 0
  try {
    const { challengeUserId } = req.body
    let challengeUserData: any = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) })
    if (!challengeUserData)
      return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge"), {}, {}))
    let challengeListData: any = await challengeListModel.findOne({ _id: new ObjectId(challengeUserData?.challengeListId.toString()), isActive: true, isBlock: false })
    if (!challengeListData)
      return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge list"), {}, {}))
    let currencyListData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData?.currencyListId), isActive: true, isBlock: false })
    if (!currencyListData)
      return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("currency list in challenge user id"), {}, {}))
    if (challengeUserData?.paymentStatus == challengeUserPaymentStatus?.completed)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment is already completed"), {}, {}))
    for (let oneTradingCurrency of challengeListData?.tradingCurrency) {
      if (oneTradingCurrency?.buyChallengeCurrency?.length > 0) {

        for (let oneBuyCurrency of oneTradingCurrency?.buyChallengeCurrency) {
          if (oneBuyCurrency?.currency == challengeUserData?.currencyCode) {
            isMatchTradingCurrency = true
            actualChallengeAmount = oneBuyCurrency.amount
            // if (challengeUserData?.amount == actualChallengeAmount) {
            //   isMatchTradingCurrencyAmount = true
            // }
          }
        }
      }
    }
    if (!isMatchTradingCurrency) {
      return res.status(400).json(await apiResponse(400, responseMessage.customMessage("Your requested currency code for amount payment not available"), {}, {}))
    }
    // if (!isMatchTradingCurrencyAmount) {
    // }
    const paymentResponse: any = await create_payment_link_airwallex({ userId: user?._id, amount: challengeUserData?.amount, title: `${getCurrencyDetails(currencyListData?.code)?.currencySymbol} ${paymentAmountFormat(challengeUserData?.accountBalance)} ${challengeListData?.name || 'Challenge'}`, airWallexUserId: user?.airWallexUserId, currency: challengeUserData?.currencyCode })
    if (paymentResponse?.error)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), {}, paymentResponse?.data))
    challengeUserData = await challengeUserModel.findOneAndUpdate({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }, { amount: actualChallengeAmount, airwallexPaymentLinkId: paymentResponse?.data?.id }, { new: true })
    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("Payment Intent Create"), paymentResponse?.data, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const get_payment_airwallex_link = async (req: Request, res: Response) => {
  let user: any = req.header('user')
  try {
    const { paymentLinkId } = req.query
    const paymentResponse: any = await retrieved_payment_airwallex_link({ paymentLinkId })
    if (paymentResponse?.error)
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), {}, paymentResponse?.data))

    return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("Payment Intent Create"), paymentResponse?.data, {}))
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const challenge_payment_confirmation = async (req: Request, res: Response) => {
  reqInfo(req)
  let user: any = req.header('user'), actualChallengeAmount: any = 0
  try {
    const { paymentLinkId, challengeUserId } = req.body
    const [paymentResponse, challengeUserData, paymentLinkAlreadyAssign]: any = await Promise.all([
      retrieved_payment_airwallex_link({ paymentLinkId }),
      challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }),
      challengeUserModel.findOne({ airwallexPaymentLinkId: paymentLinkId, isActive: true, isBlock: false, }),
    ])
    if (!user?.country || !user?.city || !user?.email || !user?.firstName || !user?.lastName || !user?.phoneNumber || !user?.postalCode || !user?.state || !user?.city) {
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("First fill your account details"), {}, {}))
    }
    if (paymentResponse?.error) {
      return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), {}, paymentResponse?.data))
    }
    let challengeListData: any = await challengeListModel.findOne({ _id: new ObjectId(challengeUserData.challengeListId), isActive: true, isBlock: false })
    if (!challengeListData) return res.status(404).json(await apiResponse(404, responseMessage.getDataNotFound("challenge list"), {}, {}))
    if (!challengeUserData)
      return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge"), {}, {}))
    if (paymentLinkAlreadyAssign)
      return res.status(409).json(await apiResponse(409, responseMessage?.dataAlreadyExist("payment link"), {}, {}))

    if (paymentResponse?.data?.status == airwallexPaymentStatus?.unpaid) {
      await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }, { paymentStatus: challengeUserPaymentStatus?.failed, airwallexPaymentLinkId: paymentLinkId })
      return res.status(200).json(await apiResponse(200, responseMessage?.paymentFailed, {}, {}))
    } else {

      let currencyListData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData?.currencyListId), isActive: true, isBlock: false })
      if (!currencyListData)
        return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("currency list in challenge user id"), {}, {}))

      for (let oneTradingCurrency of challengeListData?.tradingCurrency) {
        if (oneTradingCurrency?.buyChallengeCurrency?.length > 0) {

          for (let oneBuyCurrency of oneTradingCurrency?.buyChallengeCurrency) {
            if (oneBuyCurrency?.currency == challengeUserData?.currencyCode) {
              actualChallengeAmount = oneBuyCurrency.amount
            }
          }
        }
      }
      if (paymentResponse?.data?.amount != actualChallengeAmount)
        return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Your paid amount and challenge amount not matching"), {}, {}))
      await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }, { paymentStatus: challengeUserPaymentStatus?.completed, airwallexPaymentLinkId: paymentLinkId, status: challengeUserStatus?.running })

      // Meta trader 5 Configuration
      if (challengeUserData?.serverDetail == 'mt5') {
        let MTCreationResponse: any = await MT5_creation({ user, currencyListData, challengeUserData, challengeUserId })
        // console.log(`META CREATION RESPONSE: ${MTCreationResponse}`);
        if (MTCreationResponse?.error) {
          let accountIsGenerated = false
          for (let i = 0; i < 5; i++) {
            MTCreationResponse = await MT5_creation({ user, currencyListData, challengeUserData, challengeUserId })
            if (!MTCreationResponse?.error) {
              accountIsGenerated = true
              return
            }
          }
          if (!accountIsGenerated)
            return res.status(400).json(MTCreationResponse?.data)
        }
      }

      // Meta trader 4 Configuration
      if (challengeUserData?.serverDetail == 'mt4') {
        let MTCreationResponse: any = await MT4_creation({ user, currencyListData, challengeUserData, challengeUserId })
        if (MTCreationResponse?.error) {
          let accountIsGenerated = false
          for (let i = 0; i < 5; i++) {
            MTCreationResponse = await MT4_creation({ user, currencyListData, challengeUserData, challengeUserId })
            if (!MTCreationResponse?.error) {
              accountIsGenerated = true
              return
            }
          }
          if (!accountIsGenerated)
            return res.status(400).json(MTCreationResponse?.data)
        }
      }
      user = await userModel.findOne({ _id: new ObjectId(user?._id) })
      await get_profile_calculation({ user })
      if (user?.error) {
        console.log(user?.data);
      }
      return res.status(200).json(await apiResponse(200, responseMessage?.paymentSuccess, {}, {}))
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
  }
}

export const payment_paid_after_remaining_operation_in_challenge = async (challengeUserData, paymentResponse, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      let actualChallengeAmount: any = 0, challengeUserId: any = challengeUserData?._id
      let challengeListData: any = await challengeListModel.findOne({ _id: new ObjectId(challengeUserData.challengeListId), isActive: true, isBlock: false })

      if (paymentResponse?.data?.status == airwallexPaymentStatus?.unpaid) {
        await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }, { paymentStatus: challengeUserPaymentStatus?.failed, })
        resolve({ error: false, data: {} })
      } else {

        let currencyListData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData?.currencyListId), isActive: true, isBlock: false })

        if (currencyListData) {
          for (let oneTradingCurrency of challengeListData?.tradingCurrency) {
            if (oneTradingCurrency?.buyChallengeCurrency?.length > 0) {

              for (let oneBuyCurrency of oneTradingCurrency?.buyChallengeCurrency) {
                if (oneBuyCurrency?.currency == challengeUserData?.currencyCode) {
                  actualChallengeAmount = oneBuyCurrency.amount
                }
              }
            }
          }
          // if (paymentResponse?.data?.amount != actualChallengeAmount)
          //   return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Your paid amount and challenge amount not matching"), {}, {}))
          await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }, { paymentStatus: challengeUserPaymentStatus?.completed, status: challengeUserStatus?.running })

          // Meta trader 5 Configuration
          if (challengeUserData?.serverDetail == 'mt5') {
            let MTCreationResponse: any = await MT5_creation({ user, currencyListData, challengeUserData, challengeUserId })
            if (MTCreationResponse?.error) {
              let accountIsGenerated = false
              for (let i = 0; i < 5; i++) {
                MTCreationResponse = await MT5_creation({ user, currencyListData, challengeUserData, challengeUserId })
                if (!MTCreationResponse?.error) {
                  accountIsGenerated = true
                  return
                }
              }
              if (!accountIsGenerated)
                resolve({ error: true, data: MTCreationResponse?.data })
              // return res.status(400).json(MTCreationResponse?.data)
            }
          }

          // Meta trader 4 Configuration
          if (challengeUserData?.serverDetail == 'mt4') {
            let MTCreationResponse: any = await MT4_creation({ user, currencyListData, challengeUserData, challengeUserId })
            if (MTCreationResponse?.error) {
              let accountIsGenerated = false
              for (let i = 0; i < 5; i++) {
                MTCreationResponse = await MT4_creation({ user, currencyListData, challengeUserData, challengeUserId })
                if (!MTCreationResponse?.error) {
                  accountIsGenerated = true
                  return
                }
              }
              if (!accountIsGenerated)
                resolve({ error: true, data: MTCreationResponse?.data })
              // return res.status(400).json(MTCreationResponse?.data)
            }
          }
          user = await userModel.findOne({ _id: new ObjectId(user?._id) })
          await get_profile_calculation({ user })
          if (user?.error) {
            console.log(user?.data);
          }
          let currencyData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData.currencyListId), isActive: true, isBlock: false })
          mailSend(user.email, "Order Confirmation", `${user.firstName} your challenge purchase successfully`, orderConfirmationTemplate(`${user?.firstName} ${user?.lastName}`, `${challengeUserData?.accountBalance} ${currencyData?.code}`))
          return resolve({ error: false, data: {} })
        }
      }
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error })
    }
  })
}