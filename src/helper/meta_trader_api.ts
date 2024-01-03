"use strict"
import config from 'config'
import axios from 'axios'

const meta_trader: any = config.get('meta_trader')

export const metaTraderURLs = {
  create_meta_trader5: (profileId) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt5/provisioning-profiles/${profileId}/accounts`,
  mt5_update_account_balance: (profileId, login) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt5/provisioning-profiles/${profileId}/accounts/${login}/balance-transactions`,
  mt5_get_account_by_login: (profileId, login) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt5/provisioning-profiles/${profileId}/users/${login}`,
  create_meta_trader4: (profileId) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt4/provisioning-profiles/${profileId}/accounts`,
  create_meta_trader4_trading_account: () => `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts`,
  create_meta_trader5_trading_account: () => `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts`,
  mt4_update_account_balance: (profileId, login) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt4/provisioning-profiles/${profileId}/accounts/${login}/balance-transactions`,
  mt4_get_account_by_login: (profileId, login) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt4/provisioning-profiles/${profileId}/users/${login}`,
  get_account_positions: (accountId) => `https://mt-client-api-35ohoo5yzef8tebc.london.agiliumtrade.ai/users/current/accounts/${accountId}/positions`,
  closing_trading_position: (accountId) => `https://mt-client-api-35ohoo5yzef8tebc.london.agiliumtrade.ai/users/current/accounts/${accountId}/trade`,
  get_trading_account_information: (accountId) => `https://mt-client-api-35ohoo5yzef8tebc.london.agiliumtrade.ai/users/current/accounts/${accountId}/account-information`,
  get_trading_history_given_date_time: (accountId, startDate, endDate) => `https://metastats-api-v1.london.agiliumtrade.ai/users/current/accounts/${accountId}/historical-trades/${startDate}/${endDate}?updateHistory=true`,
  get_trading_history_order_given_date_time: (accountId, startDate, endDate) => `https://mt-client-api-35ohoo5yzef8tebc.london.agiliumtrade.ai/users/current/accounts/${accountId}/history-orders/time/${startDate}/${endDate}`,
  enable_account_feature_for_trading_account: (accountId,) => `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/enable-account-features`,
  get_trading_history_deal_given_date_time: (accountId, startDate, endDate) => `https://mt-client-api-35ohoo5yzef8tebc.london.agiliumtrade.ai/users/current/accounts/${accountId}/history-deals/time/${startDate}/${endDate}`,
  disable_trading_account: (login, profileId) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt5/provisioning-profiles/${profileId}/accounts/${login}/trading-enabled`,
  get_open_position_trading_data: (accountId) => `https://mt-client-api-35ohoo5yzef8tebc.london.agiliumtrade.ai/users/current/accounts/${accountId}/positions?refreshTerminalState=true`,
  check_mt5_password: (profileId, login) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt5/provisioning-profiles/${profileId}/accounts/${login}/checkPassword`,
  remove_trading_account: (accountId,) => `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}?executeForAllReplicas=false`,
  update_mt5_password: (profileId, login) => `https://mt-manager-api-v1.new-york.agiliumtrade.ai/users/current/mt5/provisioning-profiles/${profileId}/accounts/${login}/password`,
}

/**
 * MT4 => PurpleTradingSC-02Demo
 * MT5 => PurpleTradingSC-01MT5
 */

export const metaTraderProfileIds = {
  mt5: '330c9a64-c4de-4956-916a-46cc588b5aef',
  mt5_account: '229da83e-c7fa-416a-8dcd-01d999dede3b',
  mt4: '9451f773-68f7-46d5-be0b-1435f09f4e05',
  mt4_account: '9788a7a6-2186-4a2c-9879-ff1ec172bc78',
}

export const metaTraderServerURLs = {
  mt4: 'PurpleTradingSC-02Demo',
  mt5: 'PurpleTradingSC-01MT5',
}

export const metaTraderAccountIds = {
  mt4: 'af49294a-ec35-423a-8d59-b575348396c5',
  mt5: 'fca4650c-b48c-4e09-b0a8-9c30ccafa5af',
}

export const create_meta_trader5 = async ({ email, firstName, lastName, isFirstStep }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let group: any = "demo\\AXSE Prop\\Dot Point Capital\\5DOT01USD"
      if (isFirstStep == false) {
        group = 'demo\\AXSE Prop\\Dot Point Capital\\5DOTXC03USD'
      }
      await axios.post(
        `${metaTraderURLs?.create_meta_trader5(metaTraderProfileIds?.mt5)}`,
        {
          email,
          firstName,
          lastName,
          middleName: "",
          // phone,
          // state,
          // zip: postalCode,
          leverage: 10,
          group,
          enabled: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('create_meta_trader5 ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const create_meta_trader4 = async ({ email, firstName, lastName, city, country, isFirstStep }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${metaTraderURLs?.create_meta_trader4(metaTraderProfileIds?.mt4)}`,
        {
          country,
          email,
          city,
          // phone,
          // state,
          // zip: postalCode,
          leverage: 10,
          group: "4DOT01USD",
          enabled: true,
          address: "",
          name: firstName + " " + lastName,
          leadSource: "",
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('create_meta_trader4 ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const get_account_positions = async ({ accountId, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.get(
        `${metaTraderURLs?.get_account_positions(accountId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('get_account_positions ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const remove_trading_account = async ({ accountId, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.get(
        `${metaTraderURLs?.remove_trading_account(accountId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('remove_trading_account ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const create_meta_trader4_trading_account = async ({ firstName, lastName, login, password, baseCurrency }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${metaTraderURLs?.create_meta_trader4_trading_account()}`,
        {
          magic: 0,
          quoteStreamingIntervalInSeconds: 2.5,
          reliability: "regular",
          resourceSlots: 1,
          copyFactoryResourceSlots: 1,
          name: `${firstName} ${lastName}`,
          provisioningProfileId: metaTraderProfileIds?.mt4_account,
          login,
          password,
          baseCurrency: baseCurrency || "USD",
          server: "PurpleTradingSC-02Demo",
          platform: "mt4",
          riskManagementApiEnabled: false,
          metastatsApiEnabled: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        console.log(`Trading Account generated successfully `, data?.data);
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('create_meta_trader4_trading_account ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const create_meta_trader5_trading_account = async ({ firstName, lastName, login, password, baseCurrency }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // resolve({
      //   error: false, data: {
      //     id: "5b0e36ad-9311-477b-aa24-5ac92186666d"
      //   }
      // })
      await axios.post(
        `${metaTraderURLs?.create_meta_trader5_trading_account()}`,
        {
          magic: 0,
          quoteStreamingIntervalInSeconds: 2.5,
          reliability: "regular",
          resourceSlots: 1,
          copyFactoryResourceSlots: 1,
          name: `${firstName} ${lastName}`,
          provisioningProfileId: metaTraderProfileIds?.mt5_account,
          login,
          baseCurrency: baseCurrency || "USD",
          password,
          server: "PurpleTradingSC-01MT5",
          platform: "mt5",
          riskManagementApiEnabled: false,
          metastatsApiEnabled: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        console.log(`Trading Account generated successfully `, data?.data);
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('create_meta_trader5_trading_account ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const mt5_get_account_by_login = async ({ login, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (login) {
        await axios.get(
          `${metaTraderURLs?.mt5_get_account_by_login(metaTraderProfileIds?.mt5, login)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Auth-Token': meta_trader?.access_token,
            },
          },
        ).then(data => {
          return resolve({ error: false, data: data?.data })
        }).catch(error => {
          console.log('mt5_get_account_by_login ', error?.response?.data);
          return resolve({ error: true, data: error?.response?.data })
        })
      }
      return resolve({ error: true, data: {} })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const mt4_get_account_by_login = async ({ login, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (login) {
        await axios.get(
          `${metaTraderURLs?.mt4_get_account_by_login(metaTraderProfileIds?.mt4, login)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Auth-Token': meta_trader?.access_token,
            },
          },
        ).then(data => {
          return resolve({ error: false, data: data?.data })
        }).catch(error => {
          console.log('mt4_get_account_by_login ', error?.response?.data);
          return resolve({ error: true, data: error?.response?.data })
        })
      }
      return resolve({ error: true, data: {} })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const mt5_update_account_balance = async ({ login, amount, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${metaTraderURLs?.mt5_update_account_balance(metaTraderProfileIds?.mt5, login)}`,
        {
          amount,
          type: "DEAL_BALANCE",
          comment: "",
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('mt5_update_account_balance ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const check_mt5_password = async ({ login, password }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${metaTraderURLs?.check_mt5_password(metaTraderProfileIds?.mt5, login)}`,
        {
          password,
          type: "master",
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('mt5_update_account_balance ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const update_mt5_password = async ({ login, password }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.put(
        `${metaTraderURLs?.update_mt5_password(metaTraderProfileIds?.mt5, login)}`,
        {
          password,
          type: "master",
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('update_mt5_password ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const mt4_update_account_balance = async ({ login, amount, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${metaTraderURLs?.mt4_update_account_balance(metaTraderProfileIds?.mt4, login)}`,
        {
          amount,
          type: "OP_BALANCE",
          comment: "",
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('mt4_update_account_balance ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const closing_trading_position = async ({ accountId, positionId, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${metaTraderURLs?.closing_trading_position(accountId)}`,
        {
          actionType: "POSITION_CLOSE_ID",
          positionId: `${positionId}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('closing_trading_position ', error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const get_trading_account_information = async ({ accountId, }) => {
  /**
   * @return {
     broker: 'AXSE Brokerage Ltd.',
    currency: 'USD',
    server: 'PurpleTradingSC-01MT5',
    balance: 99.89,
    equity: 99.89,
    margin: 0,
    freeMargin: 99.89,
    leverage: 10,
    type: 'ACCOUNT_TRADE_MODE_DEMO',
    name: 'parthk',
    login: '5006578',
    credit: 0,
    platform: 'mt5',
    marginMode: 'ACCOUNT_MARGIN_MODE_RETAIL_HEDGING',
    tradeAllowed: true,
    investorMode: false,
    accountCurrencyExchangeRate: 1
  }
   */
  return new Promise(async (resolve, reject) => {
    try {
      await axios.get(
        `${metaTraderURLs?.get_trading_account_information(accountId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log('get_trading_account_information ', error?.response?.data);
        console.log(error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const get_trading_historical_data_given_date_time = async ({ accountId, startDate, endDate }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.get(
        `${metaTraderURLs?.get_trading_history_given_date_time(accountId, startDate, endDate)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log(error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const get_trading_history_deal_given_date_time = async ({ accountId, startDate, endDate }) => {
  // Start & End Date need toISOString() type
  return new Promise(async (resolve, reject) => {
    try {
      await axios.get(
        `${metaTraderURLs?.get_trading_history_deal_given_date_time(accountId, startDate, endDate)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log(error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const get_trading_history_order_given_date_time = async ({ accountId, startDate, endDate }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.get(
        `${metaTraderURLs?.get_trading_history_order_given_date_time(accountId, startDate, endDate)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log(error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const enable_account_feature_for_trading_account = async ({ accountId, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${metaTraderURLs?.enable_account_feature_for_trading_account(accountId,)}`,
        {
          riskManagementApiEnabled: false,
          metastatsApiEnabled: true,
          reliabilityIncreased: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log(error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const disable_trading_account = async ({ login, trading }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.put(
        `${metaTraderURLs?.disable_trading_account(login, metaTraderProfileIds?.mt5)}`,
        {
          trading
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log("disable_trading_account ", error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const get_open_position_trading_data = async ({ accountId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.get(
        `${metaTraderURLs?.get_open_position_trading_data(accountId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Auth-Token': meta_trader?.access_token,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log("disable_trading_account ", error?.response?.data);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const calculateTradeStats = (trades, startDate, endDate) => {
  if (!trades || !Array.isArray(trades) || trades.length === 0 || !startDate || !endDate) {
    return null; // Return null if trades array, startDate, or endDate is invalid or empty
  }

  const filteredTrades = trades.filter(trade => {
    const closeTime = new Date(trade.closeTime);
    return closeTime >= new Date(startDate) && closeTime <= new Date(endDate);
  });

  if (filteredTrades.length === 0) {
    return {
      lots: 0,
      profitFactor: 0,
      noOfTrades: 0,
      noOfSuccessTrade: 0,
      noOfLossTrade: 0,
      averageProfit: 0,
      averageLoss: 0,
      winRate: 0
    };
  }

  const stats: any = {
    lots: 0,
    profitFactor: 0,
    noOfTrades: filteredTrades.length,
    noOfSuccessTrade: 0,
    noOfLossTrade: 0,
    totalProfit: 0,
    totalLoss: 0,
    winRate: 0
  };

  filteredTrades.forEach(trade => {
    stats.lots += trade.volume || 0; // Null check for trade.volume
    if (trade.success === "won") {
      stats.noOfSuccessTrade++;
      stats.totalProfit += trade.profit || 0; // Null check for trade.profit
    } else if (trade.success === "lost") {
      stats.noOfLossTrade++;
      stats.totalLoss += Math.abs(trade.profit || 0); // Null check for trade.profit
    }
  });

  stats.profitFactor = stats.totalProfit / (stats.totalLoss || 1); // Avoid division by zero
  stats.averageProfit = stats.noOfSuccessTrade > 0 ? stats.totalProfit / stats.noOfSuccessTrade : 0;
  stats.averageLoss = stats.noOfLossTrade > 0 ? stats.totalLoss / stats.noOfLossTrade : 0;
  stats.winRate = (stats.noOfSuccessTrade / stats.noOfTrades) * 100;
  return stats;
}

(async () => {
  // console.log(await get_account_positions({ accountId: "af49294a-ec35-423a-8d59-b575348396c5" }));
  // console.log(await closing_trading_position({ accountId: "af49294a-ec35-423a-8d59-b575348396c5", symbol: "EURJPY_raw", openPrice: 0.64307, volume: 1, stopLimitPrice: 0.64, stopLoss: 0, takeProfit: 1 }));
  // console.log(await create_meta_trader4_trading_account({ firstName: "Mukund", lastName: "Khunt", login: "13200241", password: "gruZ87iHTxAo8E", }))
  // console.log(await create_meta_trader4({ email: "m1@mailinator.com", firstName: "Mukund", lastName: "Khunt", phone: "9925589774", postalCode: "394101", state: "Gujarat", city: "Surat", country: "India", }));

  // console.log(await create_meta_trader5_trading_account({ firstName: "Nihir", lastName: "Kumar", login: '5027822', password: "GrqT7tk0SHKbd#", baseCurrency: "USD" }));
  // {error: false,data: { id: '45117d3c-540f-48db-bec0-6740f33b7003', state: 'DEPLOYED' }}

  // console.log(await mt4_update_account_balance({ login: 13200241, amount: 20000 }))
  // console.log(await mt5_update_account_balance({ login: 5011037, amount: 10000 }))
  // console.log(await mt5_get_account_by_login({ login: 5011037, }))
  // console.log(await enable_account_feature_for_trading_account({ accountId: "fca4650c-b48c-4e09-b0a8-9c30ccafa5af", }))

  // console.log(await disable_trading_account({ login: 5014533, trading: true }))
  // console.log((await get_open_position_trading_data({ accountId: "5b0e47f3-9cbd-4c93-9558-6f68c3779534" }) as any)?.data)
  // console.log(await closing_trading_position({ accountId: "5b0e47f3-9cbd-4c93-9558-6f68c3779534", positionId: 1554587 }))
  // console.log(await check_mt5_password({ login: 5014533, password: "K0a%tHTlhTNxqw" }))
  // console.log(await update_mt5_password({ login: 5019303, password: "Mukund123@" }))

  // 1554587
  // Account Order History
  // console.log((await get_trading_history_deal_given_date_time({ accountId: "5b0e47f3-9cbd-4c93-9558-6f68c3779534", startDate: new Date("2023-11-01").toISOString(), endDate: new Date("2023-12-02").toISOString() }) as any)?.data);

  // console.log((await get_trading_historical_data_given_date_time({ accountId: "5b0e47f3-9cbd-4c93-9558-6f68c3779534", startDate: ("2023-12-01"), endDate: ("2023-12-02") }) as any)?.data?.trades)
  // console.log(await get_trading_history_order_given_date_time({ accountId: "5b0e47f3-9cbd-4c93-9558-6f68c3779534", startDate: new Date("2023-11-01"), endDate: new Date("2023-12-17") }));
  // console.log(await get_trading_account_information({ accountId: "fca4650c-b48c-4e09-b0a8-9c30ccafa5af", }));
  // investorPassword: '9P2Ag8ZmRA4dyF',
  // login: 13200241,
  // password: 'gruZ87iHTxAo8E'
  // =================================================================
  // Regenerate KYC Form Record
  // logger.debug(`KYC Record Regenerating start`)
  // await kycVerificationModel.deleteMany({})
  // let userData = await userModel.find({ isActive: true, isBlock: false, userType: userType?.user });
  // await Promise.all(userData?.map(async (user) => {
  //   let verificationNo = 0, orderNo = 0, otpFlag = 1

  //   while (otpFlag == 1) {
  //     for (let flag = 0; flag < 1;) {
  //       verificationNo = await Math.round(Math.random() * 100000000000)
  //       if (verificationNo.toString().length == 11) {
  //         flag++
  //       }
  //     }
  //     let isAlreadyAssign: any = await kycVerificationModel.findOne({ verificationNo: verificationNo })
  //     if (isAlreadyAssign?.verificationNo != verificationNo) otpFlag = 0
  //   }

  //   otpFlag = 1
  //   while (otpFlag == 1) {
  //     for (let flag = 0; flag < 1;) {
  //       orderNo = await Math.round(Math.random() * 10000000)
  //       if (orderNo.toString().length == 7) {
  //         flag++
  //       }
  //     }
  //     let isAlreadyAssign: any = await kycVerificationModel.findOne({ orderNo: orderNo })
  //     if (isAlreadyAssign?.orderNo != orderNo) otpFlag = 0
  //   }

  //   console.log("verificationNo ", verificationNo, " orderNo ", orderNo);
  //   await new kycVerificationModel({ createdBy: user?._id, verificationNo, orderNo, }).save()
  // }))
  // logger.debug(`KYC Record Regenerating completed successfully`)
  // =================================================================

})
  ()