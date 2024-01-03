"use strict"
import { Router } from 'express'
import { userJWT, } from '../helper'
import * as validation from '../validation'
import { userController } from '../controller'

const router = Router()
router.post('/', validation?.signup, userController.signUp)
router.post('/login', validation?.login, userController.login)
router.post("/google", validation?.social_login, userController.google_SL);
router.post("/line", validation?.social_login, userController.line_SL);
router.post("/facebook", validation?.social_login, userController.facebook_SL);
router.post("/wechat", validation?.social_login, userController.wechat_SL);
router.post("/email_verification", userController.email_verification);
router.post("/forgot_password_verification", userController.forgot_password_verification);
router.post("/reset_password", userController.email_reset_password);
router.post("/resent_email_verification", userController.resent_email_verification);
router.post("/forgot_password", validation?.forgot_password, userController.forgot_password);
router.post("/change_email_verification", validation?.forgot_password, userController.change_email_verification);
router.post("/change_email", userController.change_email);
router.post("/otp_verification", validation?.otp_verification, userController.otp_verification);
router.post("/change_password", validation?.reset_password, userController.reset_password);
router.post("/generate/refresh_token", validation?.generate_refresh_token, userController.generate_refresh_token);
router.post("/airwallex/payment/webhook", userController.airwallex_payment_webhook,);
router.post('/coinbase/webhook', userController.coinbase_webhook_payment)

//          social login email update
router.post('/social_login/change_email_verification', userController.social_login_email_verification)

router.use(userJWT)

//          Account Routes
router.get('/', userController.get_profile)
router.get('/trading_accounts_details', userController.trading_accounts_details)
router.put('/update', validation.update_profile, userController.update_profile)
router.post('/challenge_list/get', validation.get_challenge_list_pagination, userController.get_challenge_list_pagination)

//          Airwallex Routes
router.get('/airwallex/payment/link', validation.get_payment_airwallex_link, userController.get_payment_airwallex_link)
router.post('/airwallex/intent', validation.create_payment_airwallex_intent, userController.create_payment_airwallex_intent)
router.post('/airwallex/intent/confirm', validation.confirm_payment_airwallex_intent, userController.confirm_payment_airwallex_intent)
router.post('/airwallex/challenge/payment_link', validation.create_payment_airwallex_link_of_challenge_list, userController.create_payment_airwallex_link_of_challenge_list)
router.post('/airwallex/challenge/confirm_payment', validation.challenge_payment_confirmation, userController.challenge_payment_confirmation)
router.post('/airwallex/link', validation.create_payment_airwallex_link, userController.create_payment_airwallex_link)

//          Coinbase Routes
router.post('/coinbase/challenge/payment_link', validation.create_payment_coinbase_link_of_challenge_list, userController.create_payment_coinbase_link_of_challenge_list)

router.get('/coinbase/success', userController.coinbase_success_payment)
router.get('/coinbase/cancel', userController.coinbase_cancel_payment)

//          Currency List Routes
router.post('/currency_list/get', validation.get_currency_list_pagination, userController.get_currency_list_pagination)

//          Challenge Approval Routes
router.post('/challenge_approval/get', userController.get_challenge_approval_list_pagination)
router.post('/challenge_approval', userController.add_challenge_approval)

//          Challenge Buy Routes
router.post('/buy_challenge', validation.buy_challenge, userController.buy_challenge)
router.post('/buy_challenge/get', validation.get_buy_challenge_list_pagination, userController.get_buy_challenge_list_pagination)
router.get('/buy_challenge/:id', userController.get_buy_challenge_by_id)

//          Meta Trader Routes
// router.post('/meta_trader/trading_symbol_history', userController.trading_symbol_history_record)
// router.post('/meta_trader/analytic/day_wise/incremental', userController.day_wise_incremental_analytic_record)
router.post('/meta_trader/analytic/basic', userController.get_analytic_basic)
router.post('/meta_trader/analytic/result_by_position_size', userController.get_result_by_position_size)
router.post('/meta_trader/analytic/get_result_by_trade_duration', userController.get_result_by_trade_duration)
router.post('/meta_trader/regenerate_account', userController.regenerate_meta_trader_account)
router.post('/meta_trader/get_historical/data', userController.get_historical_trades)
router.post('/meta_trader/get_historical/trade_deals', userController.get_historical_trade_deals)
router.post('/meta_trader/get_history/order', userController.get_order_history)
// router.post('/meta_trader/get_history/day_wise', userController.get_history_day_wise)
//          Analytics
router.post('/meta_trader/analytic/basic/trade_list', userController.get_analytic_basic_trade_list)

//          consistency score
router.post('/get_consistency_score', userController.get_consistency_score)

//          leader board
router.post('/leader_board/get', validation.get_buy_challenge_list_pagination, userController.get_buy_challenge_leader_board)

//          payment withdrawal
router.post('/payment_withdrawal', validation.payment_withdrawal, userController.payment_withdrawal)

//          Customer Support 
router.post('/customer_support', validation.customer_support, userController.customer_support)

router.post('/profit_withdrawal', validation.profit_withdrawal, userController.profit_withdrawal)
router.post('/profit_withdrawal/get', validation.get_buy_challenge_list_pagination, userController.get_list_profit_withdrawal)

//          KYC
router.post('/kyc_verification', validation.kyc_verification, userController.kyc_verification)
router.get('/kyc_verification/get', userController.get_kyc_verification_by_id)

//          Economic calendar
router.get('/economic_calendar', userController.get_economic_calendar)
export const userRouter = router