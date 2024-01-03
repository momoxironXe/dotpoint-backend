"use strict"
import config from 'config'
import axios from 'axios'
import { v4 as uuid } from 'uuid'

const airwallex: any = config.get('airwallex')

export const getToken = async function () {
  return new Promise(async function (resolve, reject) {
    try {
      await axios
        .request({
          url: `${airwallex.url}/authentication/login`,
          method: 'post',
          headers: {
            'x-api-key': airwallex.api_key,
            'x-client-id': airwallex.client_id,
          },
        }).then(data => {
          return resolve(data?.data?.token)
        }).catch(error => {
          return resolve({ error: true, data: error?.response?.data })
        })
    } catch (error) {
      console.log(error)
      reject({ error: true, message: error })
    }
  })
};

export const create_payment_airwallex = async ({ amount, currency }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getToken()
      await axios.post(
        `${airwallex.url}/pa/payment_intents/create`,
        {
          request_id: uuid(),
          merchant_order_id: uuid(),
          amount,
          currency,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const create_payment_link_airwallex = async ({ airWallexUserId, userId, title, amount, currency }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getToken()
      await axios.post(
        `${airwallex.url}/pa/payment_links/create`,
        {
          request_id: uuid(),
          merchant_order_id: uuid(),
          amount: amount,
          collectable_shopper_info: {
            message: true,
            phone_number: false,
            reference: false,
            shipping_address: false
          },
          currency,
          customer_id: airWallexUserId,
          // default_currency: "EUR",
          // description: "shoes and dress",
          expires_at: new Date(new Date().getTime() + (3600 * 1000)),   // Add 1 hour extra,
          metadata: {
            userId: userId
          },
          // "reference": "1529",
          reusable: false,
          // "supported_currencies": [
          //   "EUR",
          //   "AUD"
          // ],
          title
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      // console.log(error)
      resolve({ error: true, data: error })
    }
  })
}

export const confirm_payment_airwallex = async ({ intentId, card, airWallexUserId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getToken()
      await axios.post(
        `${airwallex.url}/pa/payment_intents/${intentId}/confirm`,
        {
          customer_id: airWallexUserId,
          payment_method: {
            card,
            type: "card"
          },
          request_id: uuid(), return_url: `http://localhost:4000/`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error.response?.data)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const retrieved_payment_airwallex_link = async ({ paymentLinkId, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getToken()
      await axios.get(
        `${airwallex.url}/pa/payment_links/${paymentLinkId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error.response?.data)
      resolve({ error: true, data: error?.data })
    }
  })
}

export const create_customer_airwallex = async function (user: any,) {
  return new Promise(async function (resolve, reject) {
    try {
      const token = await getToken()
      const requestBody = {
        email: user?.email,
        first_name: user?.firstName,
        last_name: user?.lastName,
        merchant_customer_id: uuid(),
        request_id: uuid()
      };
      const response = await axios.request({
        url: `${airwallex.url}/pa/customers/create`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: requestBody,
      })
      resolve(response?.data)
    } catch (error) {
      console.log(error.response?.data)
      reject({ error: true, message: error })
    }
  })
};

export const update_customer_airwallex = async function (user: any,) {
  return new Promise(async function (resolve, reject) {
    try {
      const token = await getToken()
      const requestBody = {
        email: user?.email,
        first_name: user?.firstName,
        last_name: user?.lastName,
        request_id: uuid(),
      };
      const response = await axios.request({
        url: `${airwallex.url}/pa/customers/${user.airWallexUserId}/update`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: requestBody,
      })
      resolve(response?.data)
    } catch (error) {
      console.log(error.response?.data)
      reject({ error: true, message: error.response?.data })
    }
  })
};

(async () => {
  // console.log(await create_payment_link_airwallex({ airWallexUserId: "cus_hkdmwbmshgpimv76ld8", userId: "" }));
  // console.log(await create_customer_airwallex({ email: "parthk.webito@gmail.com", first_name: "Parth", last_name: "Khunt" }));
  /**
   * {
  id: 'cus_hkpddtmr5gqzh7dx6s1',
  request_id: '85f7654a-cfeb-4ab5-ac04-ea91b7b248d9',
  merchant_customer_id: '09409264-081e-4636-a445-ead66a88a87f',
  email: 'parthk.webito@gmail.com',
  phone_number: '',
  additional_info: { registered_via_social_media: false },
  client_secret: 'eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDEwODgzNjEsImV4cCI6MTcwMTA5MTk2MSwidHlwZSI6ImNsaWVudC1zZWNyZXQiLCJwYWRjIjoiSEsiLCJhY2NvdW50X2lkIjoiOTEwNDg2ZjQtYWE0My00NmE3LWIyMzUtMDM1YjE4ZjU0NTM5IiwiY3VzdG9tZXJfaWQiOiJjdXNfaGtwZGR0bXI1Z3F6aDdkeDZzMSJ9.sbNyDF8acTknhUprmzHsL1nC0WZL9rWHTnTVsfYvXek',
  created_at: '2023-11-27T12:32:41+0000',
  updated_at: '2023-11-27T12:32:41+0000'
}
   */
  // Production Account => "cus_hkpd47rxkgqzgucbmdt"
  // Development Account => "cus_hkdmgjl6jgqzdc73v5s"
})
// ()


export const payout_create = async function (data) {
  const token = await getToken()
  const { city, country_code, postcode, state, street_address, account_currency, account_name, account_number, bank_country_code, bank_name, ifscCode, email, payment_currency, payment_amount } = data
  return new Promise(async function (resolve, reject) {
    try {
      let requestBody: any = {
        beneficiary: {
          address: {
            city,
            country_code,
            postcode,
            state,
            street_address,
          },
          bank_details: {
            account_currency,
            account_name,
            account_number,
            bank_country_code,
            bank_name,
            swift_code: ifscCode
          },
          company_name: email,
          entity_type: "COMPANY"
        },
        payment_amount,
        payment_currency,
        payment_method: "SWIFT",
        reason: "bill_payment",
        reference: "reference",
        request_id: uuid(),
        source_currency: "CNY",
        status: "READY_FOR_DISPATCH",
        swift_charge_option: "PAYER"
      }
      if (country_code === "IN") {
        requestBody.beneficiary.bank_details.account_routing_type1 = "bank_code";
        requestBody.beneficiary.bank_details.account_routing_value1 = ifscCode;
      }
      let response = await axios.post(
        `https://api-demo.airwallex.com/api/v1/payments/create`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      )
      return resolve({ error: false, data: response?.data })
    } catch (error) {
      console.log(error?.response?.data)
      reject({ error: true, message: error?.response?.data })
    }
  })
};
