"use strict"
import { Router } from 'express'
import { adminJWT, userJWT, } from '../helper'
import * as validation from '../validation'
import { adminController, userController } from '../controller'

const router = Router()

router.post('/', validation?.signup, adminController.signUp)
router.post('/login', validation?.login, adminController.login)
router.post("/generate/refresh_token", validation?.generate_refresh_token, adminController.generate_refresh_token);


router.get('/dashboard/get', adminController.dashboard_get)
router.use(adminJWT)

//           Dashboard

//          User Routes
router.post('/user', validation.signup, adminController.add_user)
router.post('/user/get', adminController.get_user_pagination)
router.put('/user/unblock_block', validation.unblock_block, adminController.unblock_block)
router.put('/user', validation.update_profile, adminController.update_user)
router.get('/user/:id', adminController.get_user_by_id)

//          Challenge List Routes
router.post('/challenge_list', validation.add_update_challenge_list, adminController.add_challenge_list)
router.post('/challenge_list/get', validation.get_challenge_list_pagination, adminController.get_challenge_list_pagination)
router.put('/challenge_list', validation.add_update_challenge_list, adminController.update_challenge_list)
router.delete('/challenge_list/:id', validation?.by_id, adminController.delete_challenge_list)
router.get('/challenge_list/:id', adminController.get_challenge_by_id)

//          Challenge Users Routes
router.post('/challenge_users/get', validation.get_challenge_list_pagination, adminController.get_challenge_users_pagination)

//          Challenge Approval Routes
router.post('/challenge_approval/get', adminController.get_challenge_approval_list_pagination)
router.put('/challenge_approval', adminController.update_challenge_approval)

//          Currency List Routes
router.post('/currency_list', validation.add_update_currency_list, adminController.add_currency_list)
router.post('/currency_list/get', validation.get_currency_list_pagination, adminController.get_currency_list_pagination)
router.put('/currency_list', validation.add_update_currency_list, adminController.update_currency_list)
router.delete('/currency_list/:id', validation?.by_id, adminController.delete_currency_list)
router.get('/currency_list/:id', validation?.by_id, adminController.get_currency_by_id)

//          Server List Routes
router.post('/server', validation.add_server, adminController.add_server)
router.get('/server/get', adminController.get_server_list)
router.delete('/server/:id', validation?.by_id, adminController.delete_server)

//          payment withdrawal
router.post('/payment_withdrawal/status_update', validation.payment_withdrawal_status_update, adminController.payment_withdrawal_status_update)
router.post('/payment_withdrawal/get_list', validation.get_challenge_list_pagination, adminController.payment_withdrawal_get_list)

router.post('/profit_withdrawal/get', validation.get_buy_challenge_list_pagination, adminController.get_list_profit_withdrawal)
router.post('/profit_withdrawal/approval', validation.payout_request, adminController.payout_request)

//          customer support
router.post('/customer_support/get', validation.get_buy_challenge_list_pagination, adminController.get_list_customer_support)

//          KYC
router.post('/kyc_verification/get', adminController.get_kyc_verification_pagination)
router.put('/kyc_verification', adminController.update_kyc_verification)
router.get('/kyc_verification/:id', adminController.get_kyc_verification_id)

//          Payout
router.post('/payout/:id', adminController.payout)
router.post('/reset_account', validation.reset_account ,adminController.reset_account)

export const adminRouter = router