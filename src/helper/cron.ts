import { CronJob } from 'cron'
import { calculateUniqueDays, challengeApprovalStatus, challengeUserStatus, filterTradesByDate, getCurrentWeekDates, groupRecordsBySymbol, userType } from '../common'
import { challengeApprovalModel, challengeUserModel, currencyListModel, mtAccountSessionModel, mtOrderModel, mtTradeHistoryModel, tradingProfitModel, userModel } from '../database'
import { logger } from './winston_logger'
import mongoose, { Types } from 'mongoose'
import moment from 'moment'
import config from 'config'
import { closing_trading_position, disable_trading_account, get_open_position_trading_data, get_trading_account_information, get_trading_historical_data_given_date_time, get_trading_history_order_given_date_time, remove_trading_account } from './meta_trader_api'
import { mailSend } from './mailsend'
import { account_creation_of_step_2, get_profile_calculation } from '../controller/user'
import { userChallengeFailedTemplate, user_challenge_passed_phase1, user_challenge_passed_phase2 } from './verificationEmail'
import { kycVerificationModel } from '../database/models/kyc_verification'

const ObjectId = Types.ObjectId

const daily_trading_account_session_generator = async () => {
    try {
        logger.debug(`Daily Trading Account Session Generator`)
        let startDate: any = moment(new Date()).add(-1, 'day')
        let endDate: any = moment(new Date())
        endDate = endDate.format('YYYY-MM-DD')
        startDate = startDate.format('YYYY-MM-DD')
        let userData: any = await userModel.find({ isActive: true, isBlock: false, userType: userType?.user })
        for (let user of userData) {
            if (user?.tradingAccounts?.length > 0) {
                for (let oneAccount of user?.tradingAccounts) {
                    if (oneAccount?.accountId) {
                        let accountData: any = await get_trading_account_information({ accountId: oneAccount.accountId })
                        let historicalData: any = await get_trading_historical_data_given_date_time({ accountId: oneAccount.accountId, startDate, endDate })
                        if (!accountData?.error && !historicalData?.error) {
                            let noOfTrades: number = 0, noOfLots: number = 0, result: any = 0
                            for (let oneTrade of historicalData?.data?.trades) {
                                noOfTrades++
                                noOfLots += oneTrade?.volume || 0
                                result += oneTrade?.gain || 0
                            }
                            let oldRecord: any = await mtAccountSessionModel.findOne({ accountId: oneAccount?.accountId, workspaceId: user?.workspaceId, createdBy: new ObjectId(user?._id), challengeUserId: new ObjectId(oneAccount?.challengeUserId), isActive: true, isBlock: false }).sort({ _id: -1 })
                            if (oldRecord)
                                await mtAccountSessionModel.findOneAndUpdate({ _id: new ObjectId(oldRecord?._id) }, { closingBalance: accountData?.data?.balance })
                            await new mtAccountSessionModel({ accountId: oneAccount?.accountId, openingBalance: accountData?.data?.balance, noOfTrades, noOfLots, result, challengeUserId: oneAccount?.challengeUserId, workspaceId: user?.workspaceId, createdBy: user?._id, ...accountData?.data, startDate, endDate }).save()
                        }
                    }
                }
            }
        }

        // const novemberDays = [];
        // const novemberStart = new Date('November 1, 2023');
        // const novemberEnd = new Date('December 1, 2023');
        // for (let date = novemberStart; date < novemberEnd; date.setDate(date.getDate() + 1)) {
        //     if (date.getMonth() === 10) { // November is indexed from 0 (0-Jan, 1-Feb, ... 10-Nov)
        //         let startDate: any = moment(date).add(-1, 'day')
        //         let endDate: any = moment(date)
        //         endDate = endDate.format('YYYY-MM-DD')
        //         startDate = startDate.format('YYYY-MM-DD')
        //         let userData: any = await userModel.find({ isActive: true, isBlock: false, userType: userType?.user })
        //         for (let user of userData) {
        //             if (user?.tradingAccounts?.length > 0) {
        //                 for (let oneAccount of user?.tradingAccounts) {
        //                     if (oneAccount?.accountId) {
        //                         let accountData: any = await get_trading_account_information({ accountId: oneAccount.accountId })
        //                         let historicalData: any = await get_trading_historical_data_given_date_time({ accountId: oneAccount.accountId, startDate, endDate })
        //                         if (!accountData?.error && !historicalData?.error) {
        //                             let noOfTrades: number = 0, noOfLots: number = 0, result: any = 0
        //                             for (let oneTrade of historicalData?.data?.trades) {
        //                                 noOfTrades++
        //                                 noOfLots += oneTrade?.volume || 0
        //                                 result += oneTrade?.gain || 0
        //                             }
        //                             await new mtAccountSessionModel({ accountId: oneAccount?.accountId, noOfTrades, noOfLots, result, challengeUserId: oneAccount?.challengeUserId, workspaceId: user?.workspaceId, createdBy: user?._id, ...accountData?.data, startDate, endDate }).save()
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
    } catch (error) {
        console.log(error);
    }
}

export const daily_session_opening_closing_history = async (challengeUserId: any, filterOption: any) => {
    try {
        logger.debug(`Daily Session Opening And Closing History`)
        let dailySession: any = []
        let noOfTrades: number = 0, noOfLots: number = 0, openingAmount: any = 0, positiveProfit: number = 0, negativeProfit: number = 0, negativeDays: number = 0, positiveDays: number = 0, noOfTradingDays: number = 0, positiveTrades: number = 0, negativeTrades: number = 0, buyTrades: number = 0, sellTrades: number = 0, buyProfitTrades: number = 0, sellProfitTrades: number = 0, buyNegativeTrades: number = 0, sellNegativeTrades: number = 0, buyPositiveProfit: number = 0, buyNegativeProfit: number = 0, sellPositiveProfit: number = 0, sellNegativeProfit: number = 0
        let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
        openingAmount = challengeUserData?.accountBalance || 0
        if (challengeUserData?.accountId) {
            let startDate: any = moment(challengeUserData?.startChallengeDate)
            let endDate: any = moment(challengeUserData?.startChallengeDate)
            let endChallengeDate: any = moment(challengeUserData?.endChallengeDate)
            if (new Date(endChallengeDate) > new Date()) {
                endChallengeDate = moment(new Date())
            }
            startDate = startDate.format('YYYY-MM-DD')
            let historicalData: any = await get_trading_historical_data_given_date_time({ accountId: challengeUserData.accountId, startDate, endDate: moment(challengeUserData?.endChallengeDate).add(1, 'day').format('YYYY-MM-DD') })
            if (!historicalData?.error) {
                while (new Date(endDate) < new Date(moment(endChallengeDate).format('YYYY-MM-DD'))) {
                    let isPositiveFilter: boolean = false, isNegativeFilter: boolean = false
                    // positiveTrades: number = 0, negativeTrades: number = 0, 
                    endDate = moment(endDate).add(1, 'day')
                    endDate = endDate.format('YYYY-MM-DD')
                    // let historicalData: any = await get_trading_historical_data_given_date_time({ accountId: challengeUserData.accountId, startDate, endDate })
                    let trades: any = await filterTradesByDate(historicalData?.data?.trades || [], startDate, endDate)
                    let oneObject: any = { openingAmount }
                    logger.debug('Historical data arrived')
                    let closingAmount: any = openingAmount
                    if (trades?.length > 0) {
                        noOfTradingDays++
                    }
                    for (let oneTrade of trades) {
                        if (oneTrade.type == 'DEAL_TYPE_SELL') {
                            buyTrades++
                            if (oneTrade?.profit > 0) {
                                buyProfitTrades++
                                buyPositiveProfit += oneTrade?.profit || 0

                            } else {
                                buyNegativeTrades++
                                buyNegativeProfit += oneTrade?.profit || 0
                            }
                        }

                        if (oneTrade.type == 'DEAL_TYPE_BUY') {
                            sellTrades++
                            if (oneTrade?.profit > 0) {
                                sellProfitTrades++
                                sellPositiveProfit += oneTrade?.profit || 0

                            } else {
                                sellNegativeTrades++
                                sellNegativeProfit += oneTrade?.profit || 0
                            }
                        }

                        // Overall
                        noOfTrades++
                        noOfLots += oneTrade?.volume || 0
                        closingAmount += oneTrade?.profit || 0
                        if (oneTrade?.profit > 0) {
                            positiveTrades++
                            positiveProfit += oneTrade?.profit || 0
                            if (!isPositiveFilter) {
                                positiveDays++
                                isPositiveFilter = true
                            }
                        } else {
                            negativeTrades++
                            negativeProfit += oneTrade?.profit || 0
                            if (!isNegativeFilter) {
                                negativeDays++
                                isNegativeFilter = true
                            }
                        }
                    }
                    oneObject.challengeAmount = challengeUserData?.accountBalance
                    oneObject.startDate = startDate
                    oneObject.closeTime = startDate
                    oneObject.closingAmount = closingAmount
                    oneObject.noOfLots = noOfLots
                    oneObject.maxTradingDays = challengeUserData?.tradingPeriodDays
                    oneObject.minimumTradingDaysTradingDays = challengeUserData?.minimumTradingDays
                    oneObject.positiveProfit = positiveProfit
                    oneObject.negativeProfit = negativeProfit
                    oneObject.negativeDays = negativeDays
                    oneObject.positiveDays = positiveDays
                    oneObject.negativeTrades = negativeTrades
                    oneObject.positiveTrades = positiveTrades
                    oneObject.noOfTradingDays = noOfTradingDays
                    oneObject.noOfTrades = noOfTrades
                    oneObject.buyTrades = buyTrades
                    oneObject.buyProfitTrades = buyProfitTrades
                    oneObject.buyPositiveProfit = buyPositiveProfit
                    oneObject.buyNegativeTrades = buyNegativeTrades
                    oneObject.buyNegativeProfit = buyNegativeProfit
                    oneObject.sellTrades = sellTrades
                    oneObject.sellProfitTrades = sellProfitTrades
                    oneObject.sellPositiveProfit = sellPositiveProfit
                    oneObject.sellNegativeTrades = sellNegativeTrades
                    oneObject.sellNegativeProfit = sellNegativeProfit

                    logger.debug('Operation completed\n')
                    dailySession.push(oneObject)
                    openingAmount = oneObject.closingAmount
                    startDate = endDate
                }
            }
        }
        if (filterOption == 'currentWeek') {
            const { startDate, endDate } = getCurrentWeekDates();
            dailySession = await filterTradesByDate(dailySession, startDate, endDate)
        }
        if (filterOption == 'lastRecord') {
            dailySession = dailySession[dailySession?.length - 1]
        }
        return dailySession
    } catch (error) {
        console.log(error);
    }
}

export const trading_symbol_history = async (challengeUserId: any, filterOption: any) => {
    try {
        logger.debug(`Daily Session Opening And Closing History`)
        let dailySession: any = []
        let noOfTrades: number = 0, noOfLots: number = 0, openingAmount: any = 0, positiveProfit: number = 0, negativeProfit: number = 0, negativeDays: number = 0, positiveDays: number = 0, noOfTradingDays: number = 0
        let challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserId), isActive: true, isBlock: false })
        openingAmount = challengeUserData?.accountBalance || 0
        if (challengeUserData?.accountId) {
            let startDate: any = moment(challengeUserData?.startChallengeDate)
            let endDate: any = moment(challengeUserData?.startChallengeDate)
            let endChallengeDate: any = moment(challengeUserData?.endChallengeDate)
            if (new Date(endChallengeDate) > new Date()) {
                endChallengeDate = moment(new Date())
            }
            startDate = startDate.format('YYYY-MM-DD')
            let historicalData: any = await get_trading_historical_data_given_date_time({ accountId: challengeUserData.accountId, startDate, endDate: moment(challengeUserData?.endChallengeDate).add(1, 'day').format('YYYY-MM-DD') })
            if (!historicalData?.error) {
                if (filterOption == 'currentDay') {
                    dailySession = await filterTradesByDate(historicalData?.data?.trades, moment(new Date()).format('YYYY-MM-DD'), moment(new Date()).add(1, 'day').format('YYYY-MM-DD'))
                    dailySession = groupRecordsBySymbol(dailySession)
                }
                else {
                    dailySession = groupRecordsBySymbol(historicalData?.data?.trades)
                }
            }
        }
        return dailySession
    } catch (error) {
        console.log(error);
    }
}

const challenge_user_end_date_checker = async () => {
    try {
        logger.debug(`Checking For Any Challenge Reach End Date`)
        let [challengeUserData,]: any = await Promise.all([
            challengeUserModel.find({ status: challengeUserStatus?.running, isActive: true, isBlock: false, }),
        ])
        for (let oneChallenge of challengeUserData) {
            let updateJson: any = {
                maxDailyLossObjective: {
                    isPassed: false,
                    percentage: 0,
                    value: 0
                }
            }
            if (oneChallenge?.tradingPeriodDays <= oneChallenge?.DurationOfLastTradeTakenInDays) {
                await userModel.updateOne({ _id: new ObjectId(challengeUserData?.createdBy), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id), }, { $set: { "tradingAccounts.$.isChallengeEnded": true } })
                updateJson.status = challengeUserStatus?.ended
            }
            await challengeUserModel.updateOne({ _id: new ObjectId(oneChallenge?._id), isActive: true, isBlock: false }, updateJson)
        }
    } catch (error) {
        console.log(error);
    }
}

const order_historical_data_storing_information_database = async () => {
    try {
        logger.debug(`Order Historical Data Storing Information Into Database`)
        let endDate: any = moment(new Date()).add(1, 'day')
        let startDate: any = moment(new Date()).set({ hour: 0, minute: 0, second: 0, })
        endDate = endDate.format('YYYY-MM-DD')
        startDate = startDate.format('YYYY-MM-DD')
        let userData: any = await userModel.find({ isActive: true, isBlock: false, userType: userType?.user })
        for (let user of userData) {
            if (user?.tradingAccounts?.length > 0) {
                for (let oneAccount of user?.tradingAccounts) {
                    if (oneAccount?.accountId) {
                        let accountData: any = await get_trading_historical_data_given_date_time({ accountId: oneAccount?.accountId, startDate, endDate })
                        if (!accountData?.error) {
                            for (let order of accountData?.data?.trades || []) {
                                let mtTradeHistoryData: any = await mtTradeHistoryModel.findOne({ isActive: true, isBlock: false, _id: order?._id, accountId: order?.accountId, createdBy: user?._id })
                                if (!mtTradeHistoryData)
                                    await new mtTradeHistoryModel({ isActive: true, isBlock: false, createdBy: user?._id, ...order }).save()
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

const calculation_final_account = async () => {
    try {
        logger.debug(`Calculate Final Account Number Value`)
        let userData: any = await userModel.find({ isActive: true, isBlock: false, userType: userType?.user })
        for (let user of userData) {
            let accountSize = 0;
            let equity = 0;
            let profit = 0;
            let gain = 0;
            let profitTarget = 0;

            if (user?.tradingAccounts?.length > 0) {
                for (let oneAccount of user?.tradingAccounts) {
                    let challengeData: any = await challengeUserModel.find({ _id: new ObjectId(oneAccount.challengeUserId), isActive: true, isBlock: false })
                    profit += (oneAccount.currentAccountBalance - oneAccount.accountBalance) || 0
                    accountSize += oneAccount.accountBalance || 0
                    equity += oneAccount.currentAccountBalance || 0
                    profitTarget += challengeData?.profitTarget || 0
                }
                gain = ((profit / profitTarget) * 100) || 0
            }
            await userModel.findOneAndUpdate({ _id: new ObjectId(user?._id), isActive: true }, { profit, equity, accountSize, gain })
        }
    } catch (error) {
        console.log(error);
    }
}

const trading_profits_calculation_wise_session = async () => {
    try {
        logger.debug(`Trading Profits Calculations Wise Session`)
        let challengeUserData = await challengeUserModel.aggregate([
            // { $match: { isActive: true, isBlock: false, isKYCAfter: true, } },
            { $match: { isActive: true, isBlock: false, } },
        ])
        await Promise.all(challengeUserData?.map(async (one_challenge) => {
            let [tradingProfitData, lastTradingProfitData]: any = await Promise.all([
                tradingProfitModel.findOne({ challengeUserId: new ObjectId(one_challenge?._id), isActive: true, isBlock: false, }),
                tradingProfitModel.findOne({ challengeUserId: new ObjectId(one_challenge?._id), isActive: true, isBlock: false, }).sort({ _id: -1 }),
            ])
            if (!tradingProfitData) {
                let [mtOrderHistoryData, mtOrderHistoryGroupData]: any = await Promise.all([
                    mtTradeHistoryModel.aggregate([
                        { $match: { createdBy: new ObjectId(one_challenge?.createdBy), challengeUserId: new ObjectId(one_challenge?._id), closeISOTime: { $gte: one_challenge?.startChallengeDate, $lte: one_challenge?.endChallengeDate }, isActive: true, isBlock: false, "type": { $ne: "DEAL_TYPE_BALANCE" } } },
                        { $sort: { _id: -1 } },
                    ]),
                    mtTradeHistoryModel.aggregate([
                        { $match: { createdBy: new ObjectId(one_challenge?.createdBy), challengeUserId: new ObjectId(one_challenge?._id), closeISOTime: { $gte: one_challenge?.startChallengeDate, $lte: one_challenge?.endChallengeDate }, isActive: true, isBlock: false, "type": { $ne: "DEAL_TYPE_BALANCE" } } },
                        {
                            $group: {
                                _id: null,
                                mtOrderHistoryIds: { $addToSet: "$_id" },
                                totalProfit: { $sum: "$profit" },
                            }
                        }
                    ])
                ])
                if (mtOrderHistoryData[0]?.createdAt && mtOrderHistoryData[0]) {
                    const startDate = moment(mtOrderHistoryData[0]?.createdAt);
                    const endDate = moment(one_challenge?.endChallengeDate);
                    // Calculate the difference in days
                    const diffDays = endDate.diff(startDate, 'days');
                    console.log(`First time trading profit data`)
                    await new tradingProfitModel({ challengeUserId: new ObjectId(one_challenge?._id), createdBy: new ObjectId(one_challenge?.createdBy), startDate: one_challenge?.startChallengeDate, endDate: one_challenge?.endChallengeDate, profit: mtOrderHistoryGroupData[0]?.totalProfit || 0, mtOrderHistoryIds: mtOrderHistoryGroupData[0]?.mtOrderHistoryIds || [], workspaceId: one_challenge?.workspaceId, numberOfDays: diffDays }).save()
                } else {
                    logger.debug(`Not trading profit generation date`)
                }
            } else {
                if (lastTradingProfitData?.numberOfDays > 30) {
                    let [mtOrderHistoryData, mtOrderHistoryGroupData]: any = await Promise.all([
                        mtTradeHistoryModel.aggregate([
                            { $match: { createdBy: new ObjectId(one_challenge?.createdBy), challengeUserId: new ObjectId(one_challenge?._id), closeISOTime: { $gte: moment(new Date()).add(-1, 'd').toDate(), }, isActive: true, isBlock: false, "type": { $ne: "DEAL_TYPE_BALANCE" } } }, ,
                            { $sort: { _id: -1 } },
                        ]),
                        mtTradeHistoryModel.aggregate([
                            { $match: { createdBy: new ObjectId(one_challenge?.createdBy), challengeUserId: new ObjectId(one_challenge?._id), closeISOTime: { $gte: moment(new Date()).add(-1, 'd').toDate(), }, isActive: true, isBlock: false, "type": { $ne: "DEAL_TYPE_BALANCE" } } },
                            {
                                $group: {
                                    _id: null,
                                    mtOrderHistoryIds: { $addToSet: "$_id" },
                                    totalProfit: { $sum: "$profit" },
                                }
                            }
                        ])
                    ])
                    if (mtOrderHistoryData[0]?.createdAt && mtOrderHistoryData[0]) {
                        const startDate = moment(new Date()).add(-1, 'd').toDate();
                        const endDate = moment(new Date());
                        // Calculate the difference in days
                        const diffDays = endDate.diff(startDate, 'days');
                        console.log(`Generate trading profit data`)
                        await new tradingProfitModel({ challengeUserId: new ObjectId(one_challenge?._id), createdBy: new ObjectId(one_challenge?.createdBy), startDate: moment(new Date()).add(-1, 'd').toDate(), endDate: new Date(), profit: mtOrderHistoryGroupData[0]?.totalProfit || 0, mtOrderHistoryIds: mtOrderHistoryGroupData[0]?.mtOrderHistoryIds || [], workspaceId: one_challenge?.workspaceId, numberOfDays: diffDays }).save()
                    }
                } else {
                    let [mtOrderHistoryData, mtOrderHistoryGroupData]: any = await Promise.all([
                        mtTradeHistoryModel.aggregate([
                            { $match: { createdBy: new ObjectId(one_challenge?.createdBy), challengeUserId: new ObjectId(one_challenge?._id), closeISOTime: { $gte: lastTradingProfitData?.startDate, $lte: new Date() }, isActive: true, isBlock: false, "type": { $ne: "DEAL_TYPE_BALANCE" } } },
                            { $sort: { _id: -1 } },
                        ]),
                        mtTradeHistoryModel.aggregate([
                            { $match: { createdBy: new ObjectId(one_challenge?.createdBy), challengeUserId: new ObjectId(one_challenge?._id), closeISOTime: { $gte: lastTradingProfitData?.startDate, $lte: new Date() }, isActive: true, isBlock: false, "type": { $ne: "DEAL_TYPE_BALANCE" } } },
                            {
                                $group: {
                                    _id: null,
                                    mtOrderHistoryIds: { $addToSet: "$_id" },
                                    totalProfit: { $sum: "$profit" },
                                }
                            }
                        ])
                    ])
                    const startDate = moment(lastTradingProfitData?.startDate);
                    const endDate = moment(new Date());
                    // Calculate the difference in days
                    // console.log(`StartDate: ${ startDate.toDate() }\n, EndDate: ${ endDate.toDate() }`)
                    const diffDays = endDate.diff(startDate, 'days');
                    console.log(`Update trading profit data`)
                    await tradingProfitModel.findOneAndUpdate({ _id: new ObjectId(lastTradingProfitData?._id) }, { endDate: new Date(), profit: mtOrderHistoryGroupData[0]?.totalProfit || 0, mtOrderHistoryIds: mtOrderHistoryGroupData[0]?.mtOrderHistoryIds || [], workspaceId: one_challenge?.workspaceId, numberOfDays: diffDays })
                }
            }
        }))
        // let userData: any = await tradingProfitModel.find({ isActive: true, isBlock: false, userType: userType?.user })

    } catch (error) {
        console.log(error);
    }
}

const order_history_storing_information_database = async () => {
    try {
        logger.debug(`Order History Store Information Into Database`)
        let endDate: any = moment(new Date()).add(1, 'day')
        let startDate: any = moment(new Date()).set({ hour: 0, minute: 0, second: 0, })
        let userData: any = await userModel.find({ isActive: true, isBlock: false, userType: userType?.user })
        startDate = startDate.toDate()
        endDate = endDate.toDate()
        for (let user of userData) {
            user = await get_profile_calculation({ user })
            if (!user?.error) {
                user = user?.data
                if (user?.tradingAccounts?.length > 0) {
                    for (let oneAccount of user?.tradingAccounts) {
                        if (oneAccount?.accountId) {
                            let accountData: any = await get_trading_history_order_given_date_time({ accountId: oneAccount?.accountId, startDate: startDate, endDate: endDate })
                            if (!accountData?.error) {
                                for (let oneData of accountData?.data) {
                                    await mtOrderModel.findOneAndUpdate({ accountId: oneAccount?.accountId, workspaceId: user?.workspaceId, login: oneAccount?.login, createdBy: new ObjectId(user?._id), id: oneData?.id, type: oneData?.type }, { accountId: oneAccount?.accountId, workspaceId: user?.workspaceId, login: oneAccount?.login, createdBy: user?._id, ...oneData, }, { upsert: true })
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

const profit_trade_payout_after_30_days = async () => {
    try {
        logger.debug(`Profit trade payout after 30 days`)
        let tradingProfitData: any = await tradingProfitModel.aggregate([
            { $match: { isActive: true, isBlock: false, isWithdrawal: false, profit: 30 } },
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
                    as: "challenge_user"
                }
            },
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
                        { $project: { isBlock: 0, __v: 0, tradingAccounts: 0, } },
                    ],
                    as: "user"
                }
            },
            { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
        ])
        await Promise.all(tradingProfitData?.map(async (one_trading_profit) => {
            if (one_trading_profit && one_trading_profit?.user && one_trading_profit?.challenge_user) {
                // const data = {
                //     city: one_trading_profit?.user.city,
                //     country_code: one_trading_profit?.user.countryCode1?.toUpperCase(),
                //     postcode: one_trading_profit?.user.postalCode,
                //     state: one_trading_profit?.user.state,
                //     street_address: one_trading_profit?.user.street,
                //     account_currency: one_trading_profit?.challenge_user?.currencyCode,
                //     account_name: `${one_trading_profit?.user.firstName} ${one_trading_profit?.user.lastName}`,
                //     account_number: withdrawalData?.accountNumber,
                //     bank_country_code: one_trading_profit?.user?.countryCode1.toUpperCase(),
                //     bank_name: withdrawalData?.bankName,
                //     ifscCode: withdrawalData?.ifscCode,
                //     email: one_trading_profit?.challenge_user?.billingInfo?.email,
                //     payment_currency: one_trading_profit?.challenge_user?.currencyCode,
                //     payment_amount: one_trading_profit?.challenge_user?.amount,
                // }
            }
        }))
    } catch (error) {
        console.log(error);
    }
}

const challenge_user_profit_1_percentage_profit = async () => {
    try {
        logger.debug(`Challenge User set 1 percentage setter`)
        let challengeUserData: any = await challengeUserModel.aggregate([
            { $match: { isActive: true, isBlock: false, } },
        ])
        await Promise.all(challengeUserData?.map(async (one_challenge_user) => {
            // if (one_trading_profit && one_trading_profit?.user && one_trading_profit?.challenge_user) {

            // }
        }))
    } catch (error) {
        console.log(error);
    }
}

export const daily_10_minutes_cron_job = new CronJob('*/10 * * * *', async function () {
    logger.info('Every 10 minutes cron')
    await order_historical_data_storing_information_database()
    await challenge_user_end_date_checker()
});

export const every_3_minutes_cron_job = new CronJob('*/3 * * * *', async function () {
    logger.info('Every 3 minutes cron')
    await calculation_final_account()
});

export const daily_12_PM_cron_job = new CronJob('0 0 * * *', async function () {
    logger.info('Every Day')
    await Promise.all([
        order_history_storing_information_database(),
        daily_trading_account_session_generator(),
        trading_profits_calculation_wise_session(),
    ])
});

// Streaming API code migration
export const meta_account_stop_loss_checker = async (todayLiveProfit, overallLiveProfit, challengeUserData, user, isTriggerMaximumLoss) => {
    try {
        logger.debug(`Account challenge stop limit exceeded checker`)
        let isTradeFail = false
        if (challengeUserData?.maximumLoss <= (-overallLiveProfit)) {
            logger.debug(`Account Reached maximum overall loss`)
            isTradeFail = true

        }
        if (challengeUserData?.maximumDayLoss <= (-todayLiveProfit)) {
            logger.debug(`Account Reached maximum day loss`)
            isTradeFail = true
        }
        if (isTriggerMaximumLoss) {
            logger.debug(`Account Reached 90 % Trade Balance`)
            isTradeFail = true
        }
        // Challenge is failed because user reach maximum loss limit as per challenge configuration
        if (isTradeFail) {
            // challengeUserData = await challengeUserModel.findOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, status: challengeUserStatus?.running })
            if (challengeUserData) {
                if (user) {
                    mailSend(user?.email, "Challenge fail", `${user?.firstName} your challenge fail passing of phase 1`, userChallengeFailedTemplate(user?.firstName, challengeUserData?.login))
                }
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
                    await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false }, { isFullLimitExceed: true, status: challengeUserStatus?.terminated })
                    await disable_trading_account({ login: challengeUserData?.login, trading: false })
                    // await remove_trading_account(challengeUserData?.accountId)
                    await userModel.updateOne({ _id: new ObjectId(user?._id), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id), }, { $set: { "tradingAccounts.$.isChallengeEnded": true, } })
                }
                return { isTerminated: true, isSuccess: true }
            } else {
                return { isTerminated: true, isSuccess: true }
            }
        }
        return { isTerminated: false, isSuccess: true }
    } catch (error) {
        console.log(error);
    }
}

export const every_minute_checking_account_step_completion = async (overallLiveProfit, challengeUserData, oneAccount, numberOfDays) => {
    return new Promise(async (resolve, reject) => {
        try {
            // overallLiveProfit = 2000
            // console.log(`overallLiveProfit : ${ overallLiveProfit } profitTarget : ${ challengeUserData?.profitTarget } numberOfDays : ${ numberOfDays } Challenge Minimum Trading : ${ challengeUserData?.minimumTradingDays }`);
            logger.debug(`Account Profit Checker`)

            let userData: any = await userModel.findOne({ _id: new ObjectId(challengeUserData?.createdBy), isActive: true, isBlock: false, userType: userType?.user })
            if (overallLiveProfit >= 0 && oneAccount && challengeUserData?.status == challengeUserStatus?.running) {
                let currencyListData: any = await currencyListModel.findOne({ _id: new ObjectId(challengeUserData?.currencyListId), isActive: true, isBlock: false })
                let profitTarget = challengeUserData?.profitTarget
                // Step 2 Verification code
                if (oneAccount?.step1Completed && oneAccount?.step1Status == challengeApprovalStatus?.approved) {
                    profitTarget = profitTarget / 2
                    if (!oneAccount?.step2Completed) {
                        if (challengeUserData?.profitTarget <= overallLiveProfit) {
                            if (numberOfDays >= challengeUserData?.minimumTradingDays) {
                                let challengeApprovalData = await challengeApprovalModel.findOneAndUpdate({ createdBy: userData?._id, isStep1: true, isStep2: true, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, }, { createdBy: userData?._id, isStep1: true, isStep2: true, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, status: challengeApprovalStatus?.approved }, { upsert: true, new: true })
                                await userModel.updateOne({ _id: new ObjectId(userData?._id), isActive: true, isBlock: false, "tradingAccounts._id": new ObjectId(oneAccount?._id), "tradingAccounts.step2Completed": false }, { $set: { "tradingAccounts.$.step2Completed": true, "tradingAccounts.$.step2Status": challengeApprovalStatus?.approved, "tradingAccounts.$.step2ApprovalId": challengeApprovalData?._id, } })
                                await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, }, { status: challengeUserStatus?.completed })
                                let kycData = await kycVerificationModel.findOne({ createdBy: new ObjectId(userData._id), isActive: true, isBlock: false })
                                if (!kycData?.status) {
                                    await kycVerificationModel.findOneAndUpdate({ createdBy: new ObjectId(userData._id), isActive: true, isBlock: false }, { status: 0 }, { new: true })
                                }
                                mailSend(userData.email, "Challenge passing", `${userData.firstName} your challenge passing of phase 2 successfully`, user_challenge_passed_phase2(userData.firstName, challengeUserData?.login))
                                resolve({ error: false, data: { isStepComplete: true } })
                            }
                            // else {
                            //     await userModel.updateOne({ _id: new ObjectId(userData?._id), isActive: true, isBlock: false, "tradingAccounts._id": new ObjectId(oneAccount?._id), "tradingAccounts.step2Completed": false }, { $set: { "tradingAccounts.$.step2Completed": true, } })
                            //     resolve({ error: false, data: { isStepComplete: true } })
                            // }
                        }
                        if ((challengeUserData?.accountBalance * 0.01) <= overallLiveProfit) {
                            if (numberOfDays >= challengeUserData?.minimumTradingDays) {
                                let challengeApprovalData = await challengeApprovalModel.findOneAndUpdate({ createdBy: userData?._id, isStep1: true, isStep2: true, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, }, { createdBy: userData?._id, isStep1: true, isStep2: true, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, status: challengeApprovalStatus?.approved }, { upsert: true, new: true })
                                await userModel.updateOne({ _id: new ObjectId(userData?._id), isActive: true, isBlock: false, "tradingAccounts._id": new ObjectId(oneAccount?._id), "tradingAccounts.step2Completed": false }, { $set: { "tradingAccounts.$.step2Completed": true, "tradingAccounts.$.step2Status": challengeApprovalStatus?.approved, "tradingAccounts.$.step2ApprovalId": challengeApprovalData?._id, } })
                                await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, }, { status: challengeUserStatus?.completed })
                                mailSend(userData.email, "Challenge passing", `${userData.firstName} your challenge passing of phase 2 successfully`, user_challenge_passed_phase2(userData.firstName, challengeUserData?.login))
                                resolve({ error: false, data: { isStepComplete: true } })
                            }
                        }
                    }
                }
                // Step 1 Verification code
                else {
                    if (challengeUserData?.profitTarget <= overallLiveProfit) {
                        if (!oneAccount?.step1Completed) {
                            if (numberOfDays >= challengeUserData?.minimumTradingDays) {
                                logger.debug('STEP 1 Instant completed')
                                let challengeApprovalData = await new challengeApprovalModel({ createdBy: userData?._id, isStep1: true, isStep2: false, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, }, { createdBy: userData?._id, isStep1: true, isStep2: false, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, status: challengeApprovalStatus?.approved }, { upsert: true, new: true })
                                await userModel.updateOne({ _id: new ObjectId(userData?._id), isActive: true, isBlock: false, "tradingAccounts._id": new ObjectId(oneAccount?._id), "tradingAccounts.step1Completed": false }, {
                                    $set: {
                                        "tradingAccounts.$.step1Completed": true, "tradingAccounts.$.step1Status": challengeApprovalStatus?.approved, "tradingAccounts.$.step1ApprovalId": challengeApprovalData?._id,
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
                                mailSend(userData.email, "Challenge passing", `${userData.firstName} your challenge passing of phase 1 successfully`, user_challenge_passed_phase1(userData.firstName, challengeUserData?.login))
                                await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, }, { status: challengeUserStatus?.completed })
                                resolve({ error: false, data: { isStepComplete: true } })
                            }
                        }
                    }
                    if ((challengeUserData?.accountBalance * 0.01) <= overallLiveProfit) {
                        if (!oneAccount?.step1Completed) {
                            if (1 >= challengeUserData?.minimumTradingDays) {
                                logger.debug('STEP 1 Instant completed')
                                let challengeApprovalData = await new challengeApprovalModel({ createdBy: userData?._id, isStep1: true, isStep2: false, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, }, { createdBy: userData?._id, isStep1: true, isStep2: false, login: oneAccount?.login, accountId: oneAccount?.accountId, challengeUserId: oneAccount?.challengeUserId, status: challengeApprovalStatus?.approved }, { upsert: true, new: true })
                                await userModel.updateOne({ _id: new ObjectId(userData?._id), isActive: true, isBlock: false, "tradingAccounts._id": new ObjectId(oneAccount?._id), "tradingAccounts.step1Completed": false }, {
                                    $set: {
                                        "tradingAccounts.$.step1Completed": true, "tradingAccounts.$.step1Status": challengeApprovalStatus?.approved, "tradingAccounts.$.step1ApprovalId": challengeApprovalData?._id,
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
                                mailSend(userData.email, "Challenge passing", `${userData.firstName} your challenge passing of phase 1 successfully`, user_challenge_passed_phase1(userData.firstName, challengeUserData?.login))
                                await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, }, { status: challengeUserStatus?.completed })
                                resolve({ error: false, data: { isStepComplete: true } })
                            }
                        }
                    }
                }
            }
            resolve({ error: false, data: {} })
        } catch (error) {
            console.log(error);
            resolve({ error: true, data: error })
        }
    })
}

(async () => {
    // await trading_profits_calculation_wise_session()
    // await challenge_user_end_date_checker()
    // await daily_session_opening_closing_history("655df88a79b5207232eafe25")
    // await order_history_storing_information_database()
})
    ()