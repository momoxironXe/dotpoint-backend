"use strict"
import { Request, Router, Response } from 'express'
// import { databaseTypes } from '../common'
import { decryptData } from '../helper'
import { userRouter } from './user'
import { testRouter } from './test'
import { adminRouter } from './admin'
import { userType } from '../common'
import { uploadRouter } from './upload'

const router = Router()

const corporateAccessControl = (req: Request, res: Response, next: any) => {
    req.headers.userType = userType[req.originalUrl.split('/')[1]]
    next()
}

router.use('/user', decryptData, corporateAccessControl, userRouter)
router.use('/admin', decryptData, corporateAccessControl, adminRouter)
router.use('/upload', decryptData, corporateAccessControl, uploadRouter)
router.use('/test', decryptData, corporateAccessControl, testRouter)


export { router }