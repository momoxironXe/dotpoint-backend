"use strict"
import { logger, reqInfo } from '../../helper/winston_logger'
import { Request, Response } from 'express'
import { create_meta_trader4, create_meta_trader4_trading_account, create_meta_trader5, create_meta_trader5_trading_account, daily_session_opening_closing_history, deleteCache, get_trading_historical_data_given_date_time, get_trading_history_deal_given_date_time, get_trading_history_order_given_date_time, metaTraderAccountIds, metaTraderServerURLs, mt4_get_account_by_login, mt4_update_account_balance, mt5_get_account_by_login, mt5_update_account_balance, responseMessage, retrieved_payment_airwallex_link, temporaryTokenGeneration, trading_symbol_history } from '../../helper'
import { Types } from 'mongoose'
import { airwallexPaymentStatus, apiResponse, challengeUserPaymentStatus, groupDataByCloseTime } from '../../common'
import { challengeListModel, challengeUserModel, currencyListModel, mtAccountSessionModel, mtTradeHistoryModel, userModel } from '../../database'
import moment from 'moment'
import { mailSend } from '../../helper/mailsend'
import { loginCredentialTemplate } from '../../helper/verificationEmail'
import config from 'config'

const frontend: any = config.get('frontend')
const ObjectId = Types.ObjectId;

export const MT5_creation = async ({ user, currencyListData, challengeUserData, challengeUserId }) => {
	return new Promise(async (resolve, reject) => {
		try {
			let currentAccountBalance = 0, remainAmount = 0, accountId = metaTraderAccountIds?.mt5
			// if (challengeUserData?.login) {
			// }
			let createMetaTrader5Response: any = await create_meta_trader5({ email: challengeUserData?.billingInfo?.email, firstName: challengeUserData?.billingInfo?.firstName, lastName: challengeUserData?.billingInfo?.lastName, isFirstStep: true, })
			if (createMetaTrader5Response?.error) {
				logger.debug(`Meta trader 5 error`)
				resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 5 account generation problem occur'), {}, createMetaTrader5Response?.data) })
			}
			let accountResponse: any = await mt5_get_account_by_login({ login: createMetaTrader5Response?.data?.login })
			if (!accountResponse?.error) {
				currentAccountBalance = accountResponse?.data?.balance
			}
			if (currentAccountBalance < challengeUserData?.accountBalance) {
				remainAmount = challengeUserData?.accountBalance - currentAccountBalance
			} else {
				remainAmount = currentAccountBalance - challengeUserData?.accountBalance
			}
			await mt5_update_account_balance({ login: createMetaTrader5Response?.data?.login, amount: remainAmount })

			let userData = await userModel.findOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id) }, {
				"tradingAccounts.$": 1
			})
			if (userData?.tradingAccounts?.length == 1) {
				accountId = userData?.tradingAccounts[0]?.accountId
			} else {
				let tradingAccountData: any = await create_meta_trader5_trading_account({ firstName: challengeUserData?.billingInfo?.firstName, lastName: challengeUserData?.billingInfo?.lastName, login: `${createMetaTrader5Response?.data?.login}`, password: createMetaTrader5Response?.data?.password, baseCurrency: currencyListData?.code, })
				if (tradingAccountData?.error) {
					logger.debug(`Meta trader 5 Trading account error`)
					return resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 5 trading account generation problem occur'), {}, tradingAccountData?.data) })
				}
				accountId = tradingAccountData?.data?.id
			}

			let tradingAccountObject = {
				isChallengeEnded: false,
				step1Completed: false,
				step2Completed: false,
				step1ApprovedByAdmin: false,
				step2ApprovedByAdmin: false,
				step1Status: null,
				step2Status: null,
				step1ApprovalId: null,
				step2ApprovalId: null,
				step1CompletedAt: null,
				step2CompletedAt: null,
				accountId: accountId,
				currencyCode: currencyListData?.code,
				currencyImage: currencyListData?.image,
				challengePayCurrencyCode: challengeUserData?.currencyCode,
				accountBalance: challengeUserData?.accountBalance,
				serverDetail: challengeUserData?.serverDetail,
				endChallengeDate: challengeUserData?.endChallengeDate,
				currentAccountBalance: challengeUserData?.accountBalance,
				investorPassword: createMetaTrader5Response?.data?.investorPassword || null,
				login: createMetaTrader5Response?.data?.login || null,
				password: createMetaTrader5Response?.data?.password || null,
				challengeUserId: challengeUserId,
				serverURL: metaTraderServerURLs?.mt5,
				challengeBuyingPrice: challengeUserData?.amount
			}
			if (userData?.tradingAccounts?.length == 1) {
				await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id) }, {
					$set: {
						"tradingAccounts.$": tradingAccountObject
					}
				})
			}
			else {
				await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, }, {
					$addToSet: {
						tradingAccounts: [
							tradingAccountObject
						]
					}
				})
			}
			await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }, { accountId: accountId, startChallengeDate: new Date(), currentBalance: challengeUserData?.accountBalance, login: createMetaTrader5Response?.data?.login })
			// ENTER_EMAIL
			mailSend(user.email, "Challenge purchase", `${user.firstName} your challenge purchase successfully`, loginCredentialTemplate(`${user?.firstName} ${user?.lastName}`, createMetaTrader5Response?.data?.login, frontend?.credential))
			return resolve({ error: false, data: {} })
		} catch (error) {
			console.log(error)
			resolve({ error: true, data: error })
		}
	})
}

export const MT4_creation = async ({ user, currencyListData, challengeUserData, challengeUserId }) => {
	return new Promise(async (resolve, reject) => {
		try {
			let currentAccountBalance = 0, remainAmount = 0, accountId = metaTraderAccountIds?.mt4
			let createMetaTrader4Response: any = await create_meta_trader4({ country: challengeUserData?.billingInfo?.country, city: challengeUserData?.billingInfo?.city, email: challengeUserData?.billingInfo?.email, firstName: challengeUserData?.billingInfo?.contactNumber, lastName: challengeUserData?.billingInfo?.lastName, isFirstStep: true })
			if (createMetaTrader4Response?.error) {
				logger.debug(`Meta trader 5 error`)
				resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 4 account generation problem occur'), {}, createMetaTrader4Response?.data) })
			}
			let accountResponse: any = await mt4_get_account_by_login({ login: createMetaTrader4Response?.data?.login })
			if (!accountResponse?.error) {
				currentAccountBalance = accountResponse?.data?.balance
			}
			if (currentAccountBalance < challengeUserData?.accountBalance) {
				remainAmount = challengeUserData?.accountBalance - currentAccountBalance
			} else {
				remainAmount = currentAccountBalance - challengeUserData?.accountBalance
			}
			await mt4_update_account_balance({ login: createMetaTrader4Response?.data?.login, amount: remainAmount })
			let userData = await userModel.findOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id) }, {
				"tradingAccounts.$": 1
			})
			if (userData?.tradingAccounts?.length == 1) {
				accountId = userData?.tradingAccounts[0]?.accountId
			} else {
				let tradingAccountData: any = await create_meta_trader4_trading_account({ firstName: challengeUserData?.billingInfo?.firstName, lastName: challengeUserData?.billingInfo?.lastName, login: `${createMetaTrader4Response?.data?.login}`, password: createMetaTrader4Response?.data?.password, baseCurrency: currencyListData?.code })
				if (tradingAccountData?.error) {
					logger.debug(`Meta trader 4 Trading account error`)
					return resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 4 trading account generation problem occur'), {}, tradingAccountData?.data) })
				}
				accountId = tradingAccountData?.data?.id
			}

			let tradingAccountObject = {
				isChallengeEnded: false,
				step1Completed: false,
				step2Completed: false,
				step1ApprovedByAdmin: false,
				step2ApprovedByAdmin: false,
				step1CompletedAt: null,
				step2CompletedAt: null,
				step1Status: null,
				step2Status: null,
				step1ApprovalId: null,
				step2ApprovalId: null,
				accountId: accountId,
				currencyCode: currencyListData?.code,
				currencyImage: currencyListData?.image,
				challengePayCurrencyCode: challengeUserData?.currencyCode,
				accountBalance: challengeUserData?.accountBalance,
				serverDetail: challengeUserData?.serverDetail,
				endChallengeDate: challengeUserData?.endChallengeDate,
				currentAccountBalance: challengeUserData?.accountBalance,
				investorPassword: createMetaTrader4Response?.data?.investorPassword || null,
				login: createMetaTrader4Response?.data?.login || null,
				password: createMetaTrader4Response?.data?.password || null,
				challengeUserId: challengeUserId,
				serverURL: metaTraderServerURLs?.mt4,
				challengeBuyingPrice: challengeUserData?.amount
			}
			if (userData?.tradingAccounts?.length == 1) {
				await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id) }, {
					$set: {
						"tradingAccounts.$": tradingAccountObject
					}
				})
			} else {
				await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, }, {
					$addToSet: {
						tradingAccounts: [
							tradingAccountObject
						]
					}
				})
			}
			await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) }, {
				accountId: accountId, startChallengeDate: new Date(), currentBalance: challengeUserData?.accountBalance
			})
			resolve({ error: false, data: {} })
		} catch (error) {
			console.log(error)
			resolve({ error: true, data: error })
		}
	})
}

export const account_creation_of_step_2 = async ({ challengeUserData, currencyListData, user }) => {
	return new Promise(async (resolve, reject) => {
		try {
			let currentAccountBalance = 0, remainAmount = 0, accountId = null
			challengeUserData = JSON.parse(JSON.stringify(challengeUserData))
			challengeUserData = await new challengeUserModel({ ...challengeUserData, profitTarget: (challengeUserData?.profitTarget / 2), isStep1: false, isStep2: true, currentAccountBalance: 0, accountBalance: 0 }).save()
			let createMetaTrader5Response: any = await create_meta_trader5({ email: challengeUserData?.billingInfo?.email, firstName: challengeUserData?.billingInfo?.firstName, lastName: challengeUserData?.billingInfo?.lastName, isFirstStep: false, })
			// let createMetaTrader5Response = {
			// 	error: false,
			// 	data: {
			// 		login: 5019303,
			// 		password: "Mukund123@",
			// 		investorPassword: "Mukund123@"
			// 	}
			// }
			if (createMetaTrader5Response?.error) {
				logger.debug(`Meta trader 5 error`)
				resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 5 account generation problem occur'), {}, createMetaTrader5Response?.data) })
			}
			let accountResponse: any = await mt5_get_account_by_login({ login: createMetaTrader5Response?.data?.login })
			if (!accountResponse?.error) {
				currentAccountBalance = accountResponse?.data?.balance
			}
			if (currentAccountBalance < challengeUserData?.accountBalance) {
				remainAmount = challengeUserData?.accountBalance - currentAccountBalance
			} else {
				remainAmount = currentAccountBalance - challengeUserData?.accountBalance
			}
			await mt5_update_account_balance({ login: createMetaTrader5Response?.data?.login, amount: remainAmount })

			let tradingAccountData: any = await create_meta_trader5_trading_account({ firstName: challengeUserData?.billingInfo?.firstName, lastName: challengeUserData?.billingInfo?.lastName, login: `${createMetaTrader5Response?.data?.login}`, password: createMetaTrader5Response?.data?.password, baseCurrency: currencyListData?.code, })
			if (tradingAccountData?.error) {
				logger.debug(`Meta trader 5 Trading account error`)
				return resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 5 trading account generation problem occur'), {}, tradingAccountData?.data) })
			}
			accountId = tradingAccountData?.data?.id
			// accountId = "5b0e36ad-9311-477b-aa24-5ac92186666d"

			await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, }, { accountId: accountId, startChallengeDate: new Date(), currentBalance: challengeUserData?.accountBalance, login: createMetaTrader5Response?.data?.login, endChallengeDate: moment(new Date()).add((challengeUserData?.tradingPeriodDays || 0), 'days'), })
			let tradingAccountObject = {
				isChallengeEnded: false,
				step1Completed: true,
				step2Completed: false,
				step1ApprovedByAdmin: true,
				step2ApprovedByAdmin: false,
				step1CompletedAt: new Date(),
				step2CompletedAt: null,
				step1Status: 1,
				step2Status: null,
				step1ApprovalId: null,
				step2ApprovalId: null,
				accountId: accountId,
				currencyCode: currencyListData?.code,
				currencyImage: currencyListData?.image,
				challengePayCurrencyCode: challengeUserData?.currencyCode,
				accountBalance: challengeUserData?.accountBalance,
				serverDetail: challengeUserData?.serverDetail,
				endChallengeDate: challengeUserData?.endChallengeDate,
				currentAccountBalance: challengeUserData?.accountBalance,
				investorPassword: createMetaTrader5Response?.data?.investorPassword || null,
				login: createMetaTrader5Response?.data?.login || null,
				password: createMetaTrader5Response?.data?.password || null,
				challengeUserId: challengeUserData?._id,
				serverURL: metaTraderServerURLs?.mt4,
				challengeBuyingPrice: challengeUserData?.amount
			}
			await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, }, {
				$addToSet: {
					tradingAccounts: [
						tradingAccountObject
					]
				}
			})
			resolve({ error: true, data: {} })
		} catch (error) {
			console.log(error)
			resolve({ error: true, data: error })
		}
	})
}

export const account_creation_of_kyc_approved = async ({ challengeUserData, currencyListData, user }) => {
	return new Promise(async (resolve, reject) => {
		try {
			let currentAccountBalance = 0, remainAmount = 0, accountId = null
			challengeUserData = JSON.parse(JSON.stringify(challengeUserData))
			challengeUserData = await new challengeUserModel({ ...challengeUserData, profitTarget: (challengeUserData?.profitTarget / 2), isStep2: false, isKYCAfter: true, currentAccountBalance: 0, accountBalance: 0 }).save()
			// let createMetaTrader5Response: any = await create_meta_trader5({ email: challengeUserData?.billingInfo?.email, firstName: challengeUserData?.billingInfo?.firstName, lastName: challengeUserData?.billingInfo?.lastName, isFirstStep: false, })
			let createMetaTrader5Response = {
				error: false,
				data: {
					login: "PARTH",
					password: "PARVADIYA",
					investorPassword: "PARVADIYA"
				}
			}
			if (createMetaTrader5Response?.error) {
				logger.debug(`Meta trader 5 error`)
				resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 5 account generation problem occur'), {}, createMetaTrader5Response?.data) })
			}
			let accountResponse: any = await mt5_get_account_by_login({ login: createMetaTrader5Response?.data?.login })
			if (!accountResponse?.error) {
				currentAccountBalance = accountResponse?.data?.balance
			}
			if (currentAccountBalance < challengeUserData?.accountBalance) {
				remainAmount = challengeUserData?.accountBalance - currentAccountBalance
			} else {
				remainAmount = currentAccountBalance - challengeUserData?.accountBalance
			}
			await mt5_update_account_balance({ login: createMetaTrader5Response?.data?.login, amount: remainAmount })

			// let tradingAccountData: any = await create_meta_trader5_trading_account({ firstName: challengeUserData?.billingInfo?.firstName, lastName: challengeUserData?.billingInfo?.lastName, login: `${createMetaTrader5Response?.data?.login}`, password: createMetaTrader5Response?.data?.password, baseCurrency: currencyListData?.code, })
			// if (tradingAccountData?.error) {
			// 	logger.debug(`Meta trader 5 Trading account error`)
			// 	return resolve({ error: true, data: await apiResponse(400, responseMessage?.customMessage('Oops! Meta trader 5 trading account generation problem occur'), {}, tradingAccountData?.data) })
			// }
			// accountId = tradingAccountData?.data?.id
			accountId = "5b0e36ad-9311-477b-aa24-5ac92186666d"

			await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, }, { accountId: accountId, startChallengeDate: new Date(), currentBalance: challengeUserData?.accountBalance, login: createMetaTrader5Response?.data?.login, endChallengeDate: moment(new Date()).add((challengeUserData?.tradingPeriodDays || 0), 'days'), })
			let tradingAccountObject = {
				isChallengeEnded: false,
				step1Completed: true,
				step2Completed: false,
				step1ApprovedByAdmin: true,
				step2ApprovedByAdmin: false,
				step1CompletedAt: new Date(),
				step2CompletedAt: null,
				step1Status: 1,
				step2Status: null,
				step1ApprovalId: null,
				step2ApprovalId: null,
				accountId: accountId,
				currencyCode: currencyListData?.code,
				currencyImage: currencyListData?.image,
				challengePayCurrencyCode: challengeUserData?.currencyCode,
				accountBalance: challengeUserData?.accountBalance,
				serverDetail: challengeUserData?.serverDetail,
				endChallengeDate: challengeUserData?.endChallengeDate,
				currentAccountBalance: challengeUserData?.accountBalance,
				investorPassword: createMetaTrader5Response?.data?.investorPassword || null,
				login: createMetaTrader5Response?.data?.login || null,
				password: createMetaTrader5Response?.data?.password || null,
				challengeUserId: challengeUserData?._id,
				serverURL: metaTraderServerURLs?.mt4,
				challengeBuyingPrice: challengeUserData?.amount
			}
			await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, }, {
				$addToSet: {
					tradingAccounts: [
						tradingAccountObject
					]
				}
			})
			resolve({ error: true, data: {} })
		} catch (error) {
			console.log(error)
			resolve({ error: true, data: error })
		}
	})
}

export const regenerate_meta_trader_account = async (req: Request, res: Response) => {
	reqInfo(req)
	let { challengeUserId, }: any = req.body, user: any = req.header('user')
	try {
		if (!user?.country || !user?.city || !user?.email || !user?.firstName || !user?.lastName || !user?.phoneNumber || !user?.postalCode || !user?.state || !user?.city) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("First fill your account details"), {}, {}))
		}
		let challengeUserData: any = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge"), {}, {}))

		const foundObject = user?.tradingAccounts?.find((obj) => {
			if ((obj?.challengeUserId).toString() == (challengeUserData?._id).toString()) return obj
		}) || null;

		if (challengeUserData?.accountId && foundObject?.login)
			return res.status(409).json(await apiResponse(409, responseMessage?.dataAlreadyExist("meta account"), {}, {}))

		let [paymentResponse,]: any = await Promise.all([
			retrieved_payment_airwallex_link({ paymentLinkId: challengeUserData?.airwallexPaymentLinkId }),
		])
		if (paymentResponse?.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment failed due to technical error"), {}, paymentResponse?.data))
		}
		let challengeListData: any = await challengeListModel.findOne({ _id: new ObjectId(challengeUserData?.challengeListId), isActive: true, isBlock: false, createdBy: new ObjectId(user?._id) })
		if (!challengeListData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("challenge list"), {}, {}))

		if (challengeUserData?.paymentStatus != challengeUserPaymentStatus?.completed)
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment is not completed"), {}, {}))
		if (paymentResponse?.data?.status != airwallexPaymentStatus?.paid)
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Payment is not completed"), {}, {}))

		let currencyListData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData?.currencyListId), isActive: true, isBlock: false })
		if (!currencyListData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound("currency list in challenge user id"), {}, {}))

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
		await deleteCache(`${user?._id}`)
		return res.status(200).json(await apiResponse(200, responseMessage?.customMessage('meta trader account has been successfully regenerated'), {}, {}))
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const get_historical_trades = async (req: Request, res: Response) => {
	reqInfo(req)
	let { startDate, endDate, accountId, }: any = req.body
	try {
		let responseData: any = await get_trading_historical_data_given_date_time({ accountId, startDate, endDate })
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Oops! Technical error happen in meta trader'), {}, responseData?.data))
		}
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('historical data'), responseData?.data?.trades, {}))
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const get_historical_trade_deals = async (req: Request, res: Response) => {
	reqInfo(req)
	let { startDate, endDate, accountId, }: any = req.body
	try {
		let responseData: any = await get_trading_history_deal_given_date_time({ accountId, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), })
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Oops! Technical error happen in meta trader'), {}, responseData?.data))
		}
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('historical trade deals'), responseData?.data, {}))
	} catch (error) {
		console.log(error);
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const get_order_history = async (req: Request, res: Response) => {
	reqInfo(req)
	let { startDate, endDate, accountId, challengeUserId }: any = req.body
	try {
		let responseData: any = await get_trading_history_order_given_date_time({ accountId, startDate, endDate })
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Oops! Technical error happen in meta trader'), {}, responseData?.data))
		}
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('order history'), responseData?.data, {}))
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const get_consistency_score = async (req: Request, res: Response) => {
	reqInfo(req)
	let { challengeUserId }: any = req.body
	try {
		let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
		if (!challengeUserData?.accountId)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge account'), {}, {}))
		let responseData: any = await get_trading_history_deal_given_date_time({ accountId: challengeUserData?.accountId, startDate: challengeUserData?.createdAt, endDate: new Date(), });
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Oops! Technical error happen in meta trader"), {}, responseData?.data));
		}
		const dayWiseProfit = {};
		responseData?.data.forEach((deal: any) => {
			const date = deal.time.split('T')[0];
			const profit = deal.profit || 0;

			if (!dayWiseProfit[date]) {
				dayWiseProfit[date] = profit;
			} else {
				dayWiseProfit[date] += profit;
			}
		});
		const result = Object.keys(dayWiseProfit).map((date: any) => ({
			date,
			profit: dayWiseProfit[date],
		}));
		let maxProfit = 0;
		result.forEach((date: any) => {
			if (Math.abs(date.profit) > maxProfit) {
				maxProfit = date.profit;
			}
		})
		const absoluteSum = result.reduce((sum, day) => sum + Math.abs(day.profit), 0);
		const consistencyScore = (1 - (maxProfit / absoluteSum)) * 100 || 0;
		let newData = {
			data: result,
			consistencyScore: consistencyScore.toFixed(2)
		}
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('consistency score'), newData, {}))
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const get_history_day_wise = async (req: Request, res: Response) => {
	reqInfo(req)
	let { challengeUserId }: any = req.body,
		user: any = req.header('user')
	try {
		let responseData: any = await mtAccountSessionModel.find({ isActive: true, isBlock: false, createdBy: new ObjectId(user?._id), challengeUserId: new ObjectId(challengeUserId) })
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Oops! Technical error happen in meta trader'), {}, responseData?.data))
		}
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('history day wise'), responseData, {}))
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

// ==================================================================
// Analytics APIs

export const get_analytic_basic = async (req: Request, res: Response) => {
	reqInfo(req)
	let { challengeUserId }: any = req.body, response: any = {}, user: any = req.header('user')
	try {
		let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
		if (challengeUserData?.paymentStatus != challengeUserPaymentStatus?.completed)
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('First complete challenge payment'), {}, {}))
		const foundObject = user?.tradingAccounts?.find((obj) => {
			if ((obj?.challengeUserId).toString() == (challengeUserData?._id).toString()) return obj
		}) || null;
		let startDate: any = moment(challengeUserData?.startChallengeDate)
		let endDate: any = moment(challengeUserData?.endChallengeDate)
		endDate = endDate.format('YYYY-MM-DD')
		startDate = startDate.format('YYYY-MM-DD')
		let responseData: any = await get_trading_history_order_given_date_time({ accountId: challengeUserData?.accountId, startDate, endDate })
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Oops! Technical error happen in meta trader'), {}, responseData?.data))
		}
		response = { endDate, startDate, login: foundObject?.login, trades: responseData?.data, }
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('analytic basic'), response, {}))
	} catch (error) {
		console.log(error);
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const get_analytic_basic_trade_list = async (req: Request, res: Response) => {
	reqInfo(req)
	let { challengeUserId }: any = req.body, response: any = {}, user: any = req.header('user')
	try {
		let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
		if (challengeUserData?.paymentStatus != challengeUserPaymentStatus?.completed)
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('First complete challenge payment'), {}, {}))

		let startDate: any = moment(challengeUserData?.startChallengeDate)
		let endDate: any = moment(challengeUserData?.endChallengeDate)
		endDate = endDate.add(1, 'day').format('YYYY-MM-DD')
		startDate = startDate.format('YYYY-MM-DD')
		let responseData: any = await get_trading_historical_data_given_date_time({ accountId: challengeUserData?.accountId, startDate, endDate })
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('Oops! Technical error happen in meta trader'), {}, responseData?.data))
		}
		// console.log(responseData?.data?.trades);
		response = await groupDataByCloseTime(responseData?.data?.trades || [], 'closeTime', ['DEAL_TYPE_BALANCE'])
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('analytic basic trade list'), response, {}))
	} catch (error) {
		console.log(error);
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const day_wise_incremental_analytic_record = async (req: Request, res: Response) => {
	reqInfo(req)
	let { challengeUserId, filterOption }: any = req.body
	try {
		let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
		if (challengeUserData?.paymentStatus != challengeUserPaymentStatus?.completed)
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('First complete challenge payment'), {}, {}))
		let responseData: any = await daily_session_opening_closing_history(challengeUserId, filterOption)
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('analytic baesic'), responseData || [], {}))
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const trading_symbol_history_record = async (req: Request, res: Response) => {
	reqInfo(req)
	let { challengeUserId, filterOption }: any = req.body
	try {
		let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
		if (challengeUserData?.paymentStatus != challengeUserPaymentStatus?.completed)
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage('First complete challenge payment'), {}, {}))
		let responseData: any = await trading_symbol_history(challengeUserId, filterOption)
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('analytic based on symbol'), responseData || [], {}))
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error))
	}
}

export const get_result_by_trade_duration = async (req: Request, res: Response) => {
	reqInfo(req);
	let { startDate, endDate, challengeUserId }: any = req.body;
	try {
		let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
		if (!challengeUserData?.accountId)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge account'), {}, {}))
		let responseData: any = await get_trading_historical_data_given_date_time({ accountId: challengeUserData?.accountId, startDate, endDate, });
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Oops! Technical error happen in meta trader"), {}, responseData?.data));
		}
		const aggregatedData = {};
		const timeRanges = {
			'00:00-00:02': { start: { hours: 0, minutes: 0 }, end: { hours: 0, minutes: 2 } },
			'00:02-00:05': { start: { hours: 0, minutes: 2 }, end: { hours: 0, minutes: 5 } },
			'00:05-00:15': { start: { hours: 0, minutes: 5 }, end: { hours: 0, minutes: 15 } },
			'00:15-00:30': { start: { hours: 0, minutes: 15 }, end: { hours: 0, minutes: 30 } },
			'00:30-02:00': { start: { hours: 0, minutes: 30 }, end: { hours: 2, minutes: 0 } },
			'02:00-06:00': { start: { hours: 2, minutes: 0 }, end: { hours: 6, minutes: 0 } },
			'06:00-12:00': { start: { hours: 6, minutes: 0 }, end: { hours: 12, minutes: 0 } },
			'12:00-24:00': { start: { hours: 12, minutes: 0 }, end: { hours: 24, minutes: 0 } }
		};

		responseData?.data?.trades.forEach((entry: any) => {
			if (entry?.gain || entry?.gain == 0) {
				const hours = Math.floor(entry.durationInMinutes / 60);
				const minutes = entry.durationInMinutes % 60;
				const range = Object.keys(timeRanges).find((key) => {
					const { start, end } = timeRanges[key];
					return hours >= start.hours && hours <= end.hours && minutes >= start.minutes && minutes <= end.minutes;
				});
				if (range) {
					if (!aggregatedData[range]) {
						aggregatedData[range] = { noOfTrade: 0, result: 0 };
					}
					aggregatedData[range].noOfTrade++;
					aggregatedData[range].result += entry.gain;
				}
			}
		});
		const formattedData = Object.keys(aggregatedData).map((range) => ({
			timeRange: range,
			noOfTrade: aggregatedData[range].noOfTrade,
			result: aggregatedData[range].result.toFixed(2),
		}));
		console.log(formattedData);
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess("result by position size data"), formattedData, {}));
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
};

export const get_result_by_position_size = async (req: Request, res: Response) => {
	reqInfo(req);
	let { startDate, endDate, challengeUserId }: any = req.body;
	try {
		let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
		if (!challengeUserData)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge user'), {}, {}))
		if (!challengeUserData?.accountId)
			return res.status(404).json(await apiResponse(404, responseMessage?.getDataNotFound('challenge account'), {}, {}))
		let responseData: any = await get_trading_historical_data_given_date_time({
			accountId: challengeUserData?.accountId,
			startDate,
			endDate,
		});
		if (responseData.error) {
			return res.status(400).json(await apiResponse(400, responseMessage?.customMessage("Oops! Technical error happen in meta trader"), {}, responseData?.data));
		}
		const aggregateData = {};
		responseData?.data?.trades?.forEach((ele: any) => {
			const volume = ele?.volume;
			if (volume) {
				if (!aggregateData[volume]) {
					aggregateData[volume] = {
						noOfTrade: 0,
						result: 0,
					};
				}
				aggregateData[volume].noOfTrade++;
				aggregateData[volume].result += ele.gain;
			}
		});

		const newData = Object.keys(aggregateData).map((vol) => ({
			volume: vol,
			noOfTrade: aggregateData[vol].noOfTrade,
			result: aggregateData[vol].result.toFixed(2),
		}));
		return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess("result by position size data"), newData, {}));
	} catch (error) {
		return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error));
	}
};