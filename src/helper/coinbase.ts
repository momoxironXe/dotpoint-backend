"use strict"
import config from 'config'
import axios from 'axios'

const coinbase: any = config.get('coinbase')
const backend_url: any = config.get('backend_url')

export const create_payment_checkout_coinbase = async ({ amount, currency, name, description, userId, userName, challengeUserId, }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(
        `${coinbase.url}/charges`,
        {
          name, description, pricing_type: "fixed_price", local_price: { currency, amount }, metadata: { userId: userId, customer_name: userName, challengeUserId },
          redirect_url: `${coinbase?.success_url}`,
          cancel_url: `${coinbase?.cancel_url}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CC-Version': '2018-03-22',
            'X-CC-Api-Key': coinbase.api_key
          },
        },
      ).then(data => {
        return resolve({ error: false, data: data?.data })
      }).catch(error => {
        console.log(error);
        return resolve({ error: true, data: error?.response?.data })
      })
    } catch (error) {
      console.log(error)
      resolve({ error: true, data: error?.data })
    }
  })
}

(async () => {
  // console.log(await create_payment_link_airwallex({ airWallexUserId: "cus_hkdmwbmshgpimv76ld8", userId: "" }));
})
// ()