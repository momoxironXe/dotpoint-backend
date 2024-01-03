import { Types } from 'mongoose'
import moment from 'moment'
import fs from 'fs'
import config from 'config'
import { encryptData, logger } from '../helper'
import { mtTradeHistoryModel } from '../database'
const Winston: any = config.get('Winston')
const ObjectId = Types.ObjectId

export const apiResponse = async (status, message, data, error) => {
    return {
        status,
        message,
        data: await encryptData(data),
        error: Object.keys(error)?.length == 0 ? {} : await encryptData(error)
    }
}

export const searchInJSONArray = (jsonArray, key, keyword) => {
    return jsonArray.filter(item => item[key].includes(keyword));
}

export const URL_decode = (url) => {
    let folder_name = [], image_name
    url.split("/").map((value, index, arr) => {
        image_name = url.split("/")[url.split("/").length - 1]
        folder_name = (url.split("/"))
        folder_name.splice(url.split("/").length - 1, 1)
    })
    return [folder_name.join('/'), image_name]
}

export const imageFileTypes = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "tiff", "ico"]

export const image_folder = ['attachment',]

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function indexesToJSON(array) {
    const jsonArray = array.map((value, index) => JSON.parse(value));
    return jsonArray;
}

export const findMissingElements = (arr1, arr2) => {
    return arr1.filter(item => !arr2.includes(item));
}

export const calculateUniqueDays = (arrayOfObjects) => {
    const uniqueDays = new Set();

    for (let obj of arrayOfObjects) {
        // Extracting the date from the 'created_at' field of each object
        const createdAtDate = new Date(obj.created_at).toISOString().split('T')[0]; // Extracting YYYY-MM-DD

        // Adding the date to the set to maintain uniqueness
        uniqueDays.add(createdAtDate);
    }
    return uniqueDays.size;
}

export const paymentAmountFormat = (value: number) => Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/(\.\d{2})\d+$/g, "$1")

export const getCurrencyDetails = currencyCode => {
    switch (currencyCode) {
        case "EUR":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698642862833.png",
                currencySymbol: "EURO€"
            };
        case "USD":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698642878352.jpg",
                currencySymbol: "US$"
            };
        case "CNY":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698995083496.png",
                currencySymbol: "CN¥"
            };
        case "HKD":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698995115143.png",
                currencySymbol: "HK$"
            };
        case "TWD":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698995127403.webp",
                currencySymbol: "NT$"
            };
        case "SGD":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698995194266.png",
                currencySymbol: "S$"
            };
        case "JPY":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698995211263.png",
                currencySymbol: "¥"
            };
        case "KRW":
            return {
                flag: "6523bbaf69f26d368188b60e/attachment/1698995225676.png",
                currencySymbol: "₩"
            };
        default:
            return {
                flag: "",
                currencySymbol: ""
            };
    }
};

export const filterTradesByDate = (trades, startDate, endDate) => {
    try {
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);

        const filteredTrades = trades.filter((trade) => {
            const closeTime = new Date(trade.closeTime);
            return closeTime >= startDateTime && closeTime <= endDateTime;
        });

    } catch (error) {
        console.log("filterTradesByDate: ", error)
        return true
    }
};

export const getCurrentWeekDates = () => {
    try {
        const today = new Date();
        const currentDay = today.getDay(); // 0 for Sunday through 6 for Saturday

        // Calculate the start date (Sunday) of the current week
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - currentDay);

        // Calculate the end date (Saturday) of the current week
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        // Format the dates to be in 'YYYY-MM-DD' format
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        return { startDate: formattedStartDate, endDate: formattedEndDate };
    }
    catch (error) {
        console.log("getCurrentWeekDates: ", error)
        return { startDate: null, endDate: null };
    }
};


export const groupRecordsBySymbol = async (records) => {
    try {
        const groupedBySymbol = {};
        if (records.length > 0) {
            await records.forEach((record) => {
                const { symbol, profit } = record;
                if (!groupedBySymbol[symbol]) {
                    groupedBySymbol[symbol] = [];
                }
                groupedBySymbol[symbol].push(profit);
            });

            const totalProfits: any = {};
            await Object.keys(groupedBySymbol).forEach((symbol) => {
                const profits = groupedBySymbol[symbol];
                const totalProfit = profits.reduce((acc, curr) => acc + curr, 0);
                totalProfits[symbol] = totalProfit;
            });
            delete totalProfits?.undefined
            return totalProfits;
        }
    }
    catch (error) {
        console.log("groupRecordsBySymbol: ", error)
        return true
    }
};

export const groupDataByCloseTime = async (data, key, typeList) => {
    try {
        const groupedData = {};

        if (data?.length > 0) {
            await Promise.all(data.map(item => {
                const closeTime = item[key].split(' ')[0]; // Extracting date part from closeTime
                const isTypeExcluded = typeList.includes(item.type);

                if (!isTypeExcluded) {
                    if (!groupedData[closeTime]) {
                        groupedData[closeTime] = {
                            date: closeTime,
                            totalProfits: 0,
                            totalVolumes: 0,
                            noOfTrades: 0
                        };
                    }

                    groupedData[closeTime].totalVolumes += item.volume || 0;
                    groupedData[closeTime].totalProfits += item.profit || 0;
                    groupedData[closeTime].noOfTrades++;
                }
            }))
        }

        return Object.values(groupedData);
    } catch (error) {
        console.log("groupDataByCloseTime: ", error)
        return true
    }
}


export const groupTradeTypes = async (tradeData, excludedTypes) => {
    try {
        const filteredTrades = await tradeData.filter(trade => !excludedTypes.includes(trade.type));
        const groupedTrades = await filteredTrades.reduce((result, trade) => {
            const tradeType = trade.type === 'DEAL_TYPE_BUY' ? 'long' : 'short';

            if (!result[tradeType]) {
                result[tradeType] = [];
            }

            result[tradeType].push(trade);
            return result;
        }, {});

        return groupedTrades;
    }
    catch (error) {
        console.log("groupTradeTypes: ", error)
        return true
    }
};

export const calculateTradeSummary = async (trades) => {
    try {
        const numberOfTrades = trades.length;
        const totalProfit = await trades.reduce((total, trade) => total + trade.profit, 0);
        const winTrades = await trades.filter(trade => trade.success === 'won');
        const numberOfWins = winTrades.length;
        const winRate = numberOfTrades > 0 ? (numberOfWins / numberOfTrades) * 100 : 0;
        const averageProfit = numberOfTrades > 0 ? totalProfit / numberOfTrades : 0;

        // Calculating Risk-Reward Ratio (RRR)
        const totalPositiveProfit = winTrades.reduce((total, trade) => total + trade.profit, 0);
        const totalNegativeProfit = totalProfit - totalPositiveProfit;
        const riskRewardRatio = totalNegativeProfit !== 0 ? Math.abs(totalPositiveProfit / totalNegativeProfit) : Infinity;

        return {
            numberOfTrades,
            totalProfit,
            winRate,
            averageProfit,
            riskRewardRatio,
        };
    }
    catch (error) {
        console.log("calculateTradeSummary: ", error)
        return true
    }
};

export const groupDataByCloseTimeAsync = (data, key, typeList) => {
    return new Promise(resolve => {
        try {
            const groupedData = {};

            data.forEach(item => {
                const closeTime = item[key].split(' ')[0]; // Extracting date part from closeTime
                const isTypeExcluded = typeList.includes(item.type);
                if (closeTime) {
                    if (!isTypeExcluded) {
                        if (!groupedData[closeTime]) {
                            groupedData[closeTime] = {
                                date: closeTime,
                                totalProfits: 0,
                                totalVolumes: 0,
                                noOfTrades: 0
                            };
                        }

                        groupedData[closeTime].totalProfits += item.profit || 0;
                        groupedData[closeTime].totalVolumes += item.volume || 0;
                        groupedData[closeTime].noOfTrades++;
                    }
                }
            });

            const result = Object.values(groupedData);
            resolve(result);
        } catch (error) {
            console.log("groupDataByCloseTimeAsync: ", error)
            return true
        }
    });
}

export const calculateOpeningClosingBalances = async (transactions, accountBalance) => {
    try {
        const updatedTransactions = [];

        for (let i = 0; i < transactions.length; i++) {
            updatedTransactions.push(transactions[i]);

            if (i < transactions.length - 1) {
                const currentDate = new Date(transactions[i].date);
                const nextDate = new Date(transactions[i + 1].date);

                const differenceInTime = nextDate.getTime() - currentDate.getTime();
                const differenceInDays = differenceInTime / (1000 * 3600 * 24);

                if (differenceInDays > 1) {
                    for (let j = 1; j < differenceInDays; j++) {
                        const newDate = new Date(currentDate.getTime());
                        newDate.setDate(newDate.getDate() + j);

                        const missingDateTransaction = { ...transactions[i] };
                        missingDateTransaction.date = newDate.toISOString().split('T')[0];
                        missingDateTransaction.profit = 0;
                        missingDateTransaction.pips = 0;
                        missingDateTransaction.lots = 0;
                        missingDateTransaction.balance = transactions[i].balance;

                        updatedTransactions.push(missingDateTransaction);
                    }
                }
            }
        }

        for (let i = 0; i < updatedTransactions.length; i++) {
            const currentTransaction = updatedTransactions[i];
            const openingBalance = i === 0 ? (accountBalance || 0) : updatedTransactions[i - 1].balance;
            const closingBalance = currentTransaction.balance;

            updatedTransactions[i].openingBalance = openingBalance;
            updatedTransactions[i].closingBalance = closingBalance;
        }

        return updatedTransactions;
    }
    catch (error) {
        console.log("calculateOpeningClosingBalances: ", error)
        return true
    }
};

export const calculateDurationInDays = async (data) => {
    try {
        const currentDate = moment(); // Current date
        data = [data[data?.length - 1]] || []
        // Map the array of objects to an array of promises
        const promises = data.map(async (item) => {
            if (item?.closeTime) {
                const closeTime = moment(item.closeTime, 'YYYY-MM-DD HH:mm:ss.SSS'); // Parse closeTime
                const durationInDays = currentDate.diff(closeTime, 'days'); // Calculate difference in days
                return { positionId: item.positionId, durationInDays };
            }
        });

        // Wait for all promises to resolve and return the results
        const results: any = await Promise.all(promises);
        return results[0]?.durationInDays;
    }
    catch (error) {
        console.log('calculateDurationInDays ', error)
        return true;
    }
};

export const calculateCompletedTradingDays = async (data) => {
    try {
        const closeTimes = data.map(item => new Date(item.closeTime));

        // Extract unique days from the closeTimes
        const uniqueDays = [...new Set(closeTimes.map(date => date.toDateString()))];

        return uniqueDays.length;
    } catch (error) {
        console.log('calculateCompletedTradingDays ', error)
        return 0
    }
};

export const mtTradeHistoryInsertion = async (tradeData, challengeUserData) => {
    try {
        const closeTimes = tradeData.map(async (one_trade) => {
            let mtTradeHistoryData = await mtTradeHistoryModel.findOne({ _id: one_trade?._id, isActive: true })
            if (!mtTradeHistoryData) {
                one_trade.createdBy = challengeUserData?.createdBy
                one_trade.accountId = challengeUserData?.accountId
                one_trade.workspaceId = challengeUserData?.workspaceId
                one_trade.challengeUserId = challengeUserData?._id
                one_trade.closeISOTime = one_trade?.closeTime
                await new mtTradeHistoryModel(one_trade).save()
            }
        })

    } catch (error) {
        console.log('calculateCompletedTradingDays ', error)
        return 0
    }
};