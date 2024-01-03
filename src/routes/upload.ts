"use strict"
import { Router } from 'express'
import { delete_file, image_compress_response, uploadJWT, uploadS3 } from '../helper'
import * as validation from '../validation'

const router = Router()

//  ------   Authentication ------  
router.use(uploadJWT)

router.post('/image/:file', validation.file_type, uploadS3.single('image'), image_compress_response)

// Delete
router.post('/delete_file', delete_file)

export const uploadRouter = router