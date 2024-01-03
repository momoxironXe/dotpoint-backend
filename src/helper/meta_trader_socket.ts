import config from 'config'
import MetaApi, { MetaStats, } from 'metaapi.cloud-sdk';
import { challengeUserModel, userModel } from '../database';
import { calculateCompletedTradingDays, calculateDurationInDays, calculateOpeningClosingBalances, calculateTradeSummary, challengeApprovalStatus, challengeUserPaymentStatus, challengeUserStatus, groupDataByCloseTime, groupDataByCloseTimeAsync, groupRecordsBySymbol, groupTradeTypes, mtTradeHistoryInsertion } from '../common';
import moment from 'moment';
import { Types } from 'mongoose';
import { every_minute_checking_account_step_completion, meta_account_stop_loss_checker } from './cron';
import { logger } from './winston_logger';
import { calculateTradeStats } from './meta_trader_api';

const ObjectId = Types.ObjectId
const { access_token } = config.get('meta_trader') as any
const api = new MetaApi(access_token);
const metaStats = new MetaStats(access_token);
const interval = 1 * 1000
const maximumLossOfPercentage = 0.1
let longShortInterval = 5000

export const meta_account_information_streaming = async (io) => {
  try {
    if (global.intervalList[`tradingAccountInterval`]?.length > 0 && global.intervalList[`tradingAccountInterval`]) {
      logger.info('Clear tradingAccountInterval')
      global.intervalList[`tradingAccountInterval`].map(data => { clearInterval(data) })
    }
    if (global.intervalList[`accountStopLossInterval`]?.length > 0 && global.intervalList[`accountStopLossInterval`]) {
      logger.info('Clear accountStopLossInterval')
      global.intervalList[`accountStopLossInterval`].map(data => { clearInterval(data) })
    }

    global.accountIdList = []
    global.intervalList[`tradingAccountInterval`] = []
    global.intervalList[`accountStopLossInterval`] = []
    const accounts = await api.metatraderAccountApi.getAccountsWithInfiniteScrollPagination();
    await Promise.all(accounts.map(async a => {
      // if (a.login == login && a.type.startsWith('cloud')) {
      if (a.type.startsWith('cloud')) {
        if (a?.id) {
          let challengeUserData = await challengeUserModel.findOne({ accountId: a?.id, status: challengeUserStatus?.running, isActive: true, isBlock: false, paymentStatus: challengeUserPaymentStatus?.completed });
          if (challengeUserData) {
            if (global.accountIdList?.indexOf(a?.id) == -1) {
              global.accountIdList.push(a?.id);
              global.metaAccount[`${a?.id}`] = {} as any
              // if (a?.id == "5b0e47f3-9cbd-4c93-9558-6f68c3779534")
              // New One
              // if (a?.id == "5b0e36ad-9311-477b-aa24-5ac92186666d")
              one_trade_account_information_handler(io, a, a?.id, challengeUserData)
            }
          }
        }
      }
    }))
    return true
  } catch (error) {
    console.log('Streaming Error ', error);
  }
}

export const one_trade_account_information_handler = async (io, account, accountId, challengeUserData) => {
  let accountStopLossInterval: any, tradingAccountInterval: any
  await account.waitConnected();
  // connect to MetaApi API
  const connection = await account.getStreamingConnection();
  await connection.connect();
  // wait until terminal state synchronized to the local state
  await connection.waitSynchronized();
  try {
    // access local copy of terminal state
    const terminalState = connection.terminalState;
    const historyStorage = connection.historyStorage;
    // console.log(Object.keys(terminalState));
    // Account is connected and with broker also
    if (terminalState?.connected && terminalState?.connectedToBroker) {
      historyStorage.orderSynchronizationFinished
      historyStorage.dealSynchronizationFinished
      // console.log(`ACCOUNT CONNECTED ID ${accountId}`);
      // console.log(terminalState?._account?._data);
      const account_stop_lose = async () => {
        try {
          // console.log('account information:', terminalState.accountInformation);
          // await challengeUserModel.updateOne({ accountId: accountId }, { login: accountInformation?.login })
          let [metricResponse, accountInformation, userData, newChallengeUserData, todayTradeData]: any = await Promise.all([
            metaStats.getMetrics(accountId),
            terminalState?.accountInformation,
            userModel.findOne({ _id: new ObjectId(challengeUserData?.createdBy), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id) }, { "tradingAccounts.$": 1, firstName: 1, lastName: 1, phoneNumber: 1, email: 1, }),
            challengeUserModel.findOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, status: challengeUserStatus?.running }),
            metaStats.getAccountTrades(accountId, moment(new Date()).format('YYYY-MM-DD'), moment(new Date()).add(1, 'days').format('YYYY-MM-DD')),
          ])
          if (!newChallengeUserData) {
            logger.debug(`newChallengeUserData: ${newChallengeUserData?._id}\n`)
            return true
          }
          challengeUserData = JSON.parse(JSON.stringify(newChallengeUserData))
          let profit: any = 0, accountBalance = challengeUserData?.accountBalance, todayLiveProfit: number = 0, overallLiveProfit: number = 0, yesterdayMetrics: any, minimumAccountBalance: number = 0, winRate: number = 0, isTriggerMaximumLoss: boolean = false, numberOfDays: number = 0;
          // console.log(accountInformation);
          // Sent to web client account information via socket connection
          io.emit(`trader_account_${accountId}`, {
            currentAccountBalance: accountInformation?.equity,
            login: accountInformation?.login,
            endDate: new Date(),
            paymentStatus: challengeUserData?.paymentStatus,
            status: challengeUserData?.status,
            challengeUserId: challengeUserData?._id,
            userId: challengeUserData?.createdBy,
          })

          // console.log('tradeDurationDiagram ', metricResponse?.tradeDuration);
          // console.log('longTrades ', metricResponse?.longTrades);
          // console.log('shortTrades ', metricResponse?.shortTrades);
          // Checking account balance touch 90% or (x%) of the actual account balance
          minimumAccountBalance = accountBalance - (accountBalance * maximumLossOfPercentage)
          if (accountInformation?.equity <= minimumAccountBalance) {
            logger.debug(`Account Equity: ${accountInformation?.equity}\n minimumAccountBalance: ${minimumAccountBalance}`)
            isTriggerMaximumLoss = true
          }
          numberOfDays = metricResponse?.dailyGrowth?.length || 0
          let lastDailyGrowthObject = metricResponse?.dailyGrowth[metricResponse?.dailyGrowth?.length - 1]
          // If an account trades today, then metrics will be updated; otherwise, that means no trade is taken by the user.
          if (lastDailyGrowthObject?.date == moment(new Date()).format('YYYY-MM-DD')) {
            profit = lastDailyGrowthObject?.profit
            yesterdayMetrics = metricResponse?.dailyGrowth[metricResponse?.dailyGrowth?.length - 2]
          } else {
            yesterdayMetrics = lastDailyGrowthObject
          }
          // New Account there is not yesterdayMetrics object
          if (!yesterdayMetrics) {
            yesterdayMetrics = {
              gains: 0,
              totalGains: 0,
              profit: 0,
              totalProfit: 0,
              lots: 0,
              pips: 0,
              balance: challengeUserData?.accountBalance, // new account should have the "yesterday" balance as the initial balance of the challenge
              drawdownProfit: 0,
              drawdownPercentage: 0,
            }
          }
          // Calculate Live Actual Amount of Profit
          todayLiveProfit = (accountInformation?.equity || 0) - (yesterdayMetrics?.balance || 0)
          overallLiveProfit = (accountInformation?.equity || 0) - (accountBalance || 0)
          // Calculate Win Rate
          if (userData?.tradingAccounts[0]?.step1Completed && userData?.tradingAccounts[0]?.step1Status == challengeApprovalStatus?.approved)
            winRate = ((((metricResponse?.averageWin || 0) * (metricResponse?.wonTrades || 0)) / (challengeUserData?.profitTarget / 2)) * 100)
          else
            winRate = ((((metricResponse?.averageWin || 0) * (metricResponse?.wonTrades || 0)) / (challengeUserData?.profitTarget || 0)) * 100)

          await Promise.all([
            challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false }, { currentBalance: accountInformation?.equity, }),
            userModel.updateOne({ _id: new ObjectId(userData?._id), isActive: true, isBlock: false, "tradingAccounts.challengeUserId": (challengeUserData?._id), }, { $set: { "tradingAccounts.$.currentAccountBalance": accountInformation?.equity, } }),
          ])
          logger.debug(`================================================\nAccount Equity: ${accountInformation?.equity}\nLIVE PROFIT: ${todayLiveProfit}\nOVERALL PROFIT: ${overallLiveProfit}\n================================================\n`);
          let [checkerResponse, stepResponse]: any = await Promise.all([
            meta_account_stop_loss_checker(todayLiveProfit, overallLiveProfit, challengeUserData, userData, isTriggerMaximumLoss),
            every_minute_checking_account_step_completion(overallLiveProfit, challengeUserData, userData?.tradingAccounts[0], numberOfDays),
          ])
          // Store Daily Trade Statistics In The Global Variables
          global.metaAccount[`${accountId}`].todayLiveProfit = todayLiveProfit
          global.metaAccount[`${accountId}`].last_trade_list = {
            todayTrade: await groupDataByCloseTime(todayTradeData || [], 'closeTime', ['DEAL_TYPE_BALANCE']),
            overallLiveProfit, winRate, averageProfit: metricResponse?.averageWin, currentAccountBalance: accountInformation?.equity
          }
          // console.log(checkerResponse);
          if (checkerResponse?.isTerminated || stepResponse?.error || stepResponse?.data?.isStepComplete) {
            accountStopLossInterval ? clearInterval(accountStopLossInterval) : ""
          }

          // console.log('positions:', terminalState.positions);
          // console.log('deals:', historyStorage.deals.slice(-5));
          // console.log('history orders:', historyStorage.historyOrders.slice(-1));
          // console.log('dailyGrowth :', accountId, " ", profit);
          // console.log('get metrics keys:', Object.keys(response));
          // await connection.closePosition('46870472')
          // console.log('get trades:', await metaStats.getAccountTrades(accountId, '2023-11-01 00:00:00.000', '2023-12-10 00:00:00.000'));
          return { error: false }
        } catch (error) {
          accountStopLossInterval ? clearInterval(accountStopLossInterval) : ""
          console.log("Every Second Meta Socket Error ", error?.message);
        }
      }
      const analysis_streaming_event_calculation = async () => {
        try {
          let [tradeData, todayTradeData]: any = await Promise.all([
            metaStats.getAccountTrades(accountId, moment(challengeUserData?.startChallengeDate).format('YYYY-MM-DD'), moment(new Date()).add(1, 'd').format('YYYY-MM-DD')),
            metaStats.getAccountTrades(accountId, moment().format('YYYY-MM-DD'), moment(new Date(new Date().setDate(new Date().getDate() + 1))).format('YYYY-MM-DD'))
          ])
          let [groupedTrades, metricResponse, groupDataByCloseTime]: any = await Promise.all([
            groupTradeTypes(tradeData, ['DEAL_TYPE_BALANCE']),
            metaStats.getMetrics(accountId),
            groupDataByCloseTimeAsync(tradeData || [], 'closeTime', ['DEAL_TYPE_BALANCE']),
          ])
          let [longSummary, shortSummary, resultByDays, overallGroupSymbol, staticsData, completedTradingDays, DurationOfLastTradeTakenInDays]: any = await Promise.all([
            groupedTrades?.long ? calculateTradeSummary(groupedTrades?.long) : {},
            groupedTrades?.short ? calculateTradeSummary(groupedTrades?.short) : {},
            calculateOpeningClosingBalances(metricResponse?.dailyGrowth, challengeUserData?.accountBalance),
            groupRecordsBySymbol(tradeData),
            calculateTradeStats(tradeData, moment(challengeUserData?.startChallengeDate).format('YYYY-MM-DD'), moment(new Date()).format('YYYY-MM-DD')),
            calculateCompletedTradingDays(tradeData),
            calculateDurationInDays(tradeData),
          ])
          staticsData = staticsData || { lots: 0, profitFactor: 0, noOfTrades: 0, noOfSuccessTrade: 0, noOfLossTrade: 0, totalProfit: 0, totalLoss: 0, winRate: 0, averageProfit: 0, averageLoss: 0, }
          global.metaAccount[`${accountId}`].long_short_list = {
            long: groupedTrades?.long || [],
            short: groupedTrades?.short || [], longSummary, shortSummary
          }
          global.metaAccount[`${accountId}`].result_by_days = { dayList: resultByDays, overallGroupSymbol: overallGroupSymbol }

          // Challenge Statistic calculation
          let { lots, profitFactor, noOfTrades, noOfSuccessTrade, noOfLossTrade, totalProfit, totalLoss, winRate, averageProfit, averageLoss } = staticsData
          let maxDailyLossObjective: any = { isPassed: false, value: (global.metaAccount[`${accountId}`].todayLiveProfit || 0) || 0, percentage: (((global.metaAccount[`${accountId}`].todayLiveProfit || 0) / challengeUserData?.maximumDayLoss) * 100) || 0 },
            maxLossObjective: any = { isPassed: false, value: totalLoss || 0, percentage: ((totalLoss / challengeUserData?.maximumLoss) * 100) || 0 },
            profitObjective = { isPassed: false, value: (totalProfit - totalLoss) || 0, percentage: (((totalProfit - totalLoss) / challengeUserData?.profitTarget) * 100) || 0 },
            minimumDayObjective = { isPassed: false, completedDays: 0 }

          if (maxLossObjective?.percentage >= 100)
            maxLossObjective.isPassed = true
          if (maxDailyLossObjective?.percentage >= 100)
            maxDailyLossObjective.isPassed = true
          if (profitObjective?.percentage >= 100)
            profitObjective.isPassed = true
          minimumDayObjective.completedDays = completedTradingDays
          if (challengeUserData?.minimumTradingDays >= completedTradingDays) {
            minimumDayObjective.isPassed = true
          }
          await challengeUserModel.updateOne({ _id: new ObjectId(challengeUserData?._id), isActive: true, isBlock: false, }, { lots, profitFactor, noOfTrades, noOfSuccessTrade, noOfLossTrade, totalProfit, totalLoss, winRate, averageProfit, averageLoss, maxDailyLossObjective, maxLossObjective, profitObjective, minimumDayObjective, DurationOfLastTradeTakenInDays })
          await Promise.all([
            result_by_trade_duration(todayTradeData),
            result_by_open_hour(todayTradeData),
            mtTradeHistoryInsertion(tradeData, challengeUserData),
          ])
          return { error: false }
        } catch (error) {
          console.log("Long Short Analysis Error ", error?.message);
          // console.log("Long Short Analysis Error ", error);
          if (tradingAccountInterval)
            tradingAccountInterval ? clearInterval(tradingAccountInterval) : ""
        }
      }
      const result_by_trade_duration = async (tradeData) => {
        try {
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

          tradeData?.forEach((entry: any) => {
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
          global.metaAccount[`${accountId}`].result_by_trade_duration = { timeList: formattedData }
          return { error: false }
        } catch (error) {
          console.log("Result By Trade Duration Error ", error?.message);
        }
      }
      const result_by_open_hour = async (tradeData) => {
        try {
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

          const toMinutes = (hours: any, minutes: any) => hours * 60 + minutes;
          tradeData.forEach((entry: any) => {
            if ((entry?.gain || entry?.gain == 0) && entry?.closeTime) {
              const closeTime = new Date(entry.closeTime);
              const closeMinutes = toMinutes(closeTime.getHours(), closeTime.getMinutes());
              const range = Object.keys(timeRanges).find((key) => {
                const { start, end } = timeRanges[key];
                const startMinutes = toMinutes(start.hours, start.minutes);
                const endMinutes = toMinutes(end.hours, end.minutes);
                return closeMinutes >= startMinutes && closeMinutes < endMinutes;
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
          global.metaAccount[`${accountId}`].result_by_open_hour = { timeList: formattedData }
          return { error: false }
        } catch (error) {
          console.log("Result By Open Hour Error ", error?.message);
        }
      }
      analysis_streaming_event_calculation()
      accountStopLossInterval = setInterval(account_stop_lose, interval)
      tradingAccountInterval = setInterval(analysis_streaming_event_calculation, longShortInterval)

      global.intervalList[`accountStopLossInterval`].push(accountStopLossInterval)
      global.intervalList[`tradingAccountInterval`].push(tradingAccountInterval)
    }
    return true
  } catch (error) {
    console.log('One Trade Information Handler ', error);
    await connection.close();
    global.accountIdList.splice(global.accountIdList.indexOf(accountId), 1);
  }
}

// meta_account_information_streaming("JELLO")