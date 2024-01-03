"use strict"
import { Router } from 'express'
import * as testController from '../test'
import multer from 'multer'

const storage = multer.diskStorage({
});
const upload = multer({ storage: storage });

const router = Router()

router.get('/instrument', testController?.get_all_instruments)

export const testRouter = router