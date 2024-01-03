"use strict"
import { Router } from 'express'
import { decryptDataAPI, encryptDataAPI } from '../helper'

const router = Router()

router.post('/encrypt', encryptDataAPI)
router.post('/decrypt', decryptDataAPI)

export const securityRouter = router