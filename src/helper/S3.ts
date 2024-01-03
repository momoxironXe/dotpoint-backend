"use strict"

import fs from 'fs'
import multer from 'multer'
import config from 'config'
import { logger, reqInfo } from './winston_logger'
import multerS3 from 'multer-s3'
import { Request, Response, response } from 'express'
import { URL_decode, apiResponse, } from '../common'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { responseMessage } from './response'

const aws: any = config.get('aws')

const s3Client = new S3Client({
    region: aws.region,
    credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
    }
})

const bucket_name = aws.bucket_name

export const uploadS3 = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: bucket_name,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req: any, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req: any, file, cb) {
            logger.info('file successfully upload')
            const file_type = file.originalname.split('.')
            req.body.size = parseInt(req.headers['content-length']) / 1048576
            req.body.location = `${req.header('user')?._id}/${req.params.file}/${Date.now().toString()}.${file_type[file_type.length - 1]}`
            cb(null, req.body.location);
        },
    }),
});


export const image_compress_response = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let headerList: any = req.originalUrl.split("/")
        headerList = headerList[headerList?.length - 2]
        return res.status(200).json(await apiResponse(200, responseMessage?.customMessage("image successfully uploaded!"), { image: req.body.location, size: req.body.size }, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const delete_file = async (req: Request, res: Response) => {
    reqInfo(req)
    let { url } = req.body
    try {
        let [folder, file,] = await URL_decode(url)
        let message = await deleteImage(file, folder)
        return res.status(200).json(await apiResponse(200, `${message}`, {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(400).json(await apiResponse(400, responseMessage?.internalServerError, {}, error));
    }
}

export const deleteImage = async function (file: any, folder: any) {
    return new Promise(async function (resolve, reject) {
        try {
            const bucketPath = `${folder}/${file}`
            let params = {
                Bucket: `${bucket_name}`,
                Key: bucketPath
            }
            const result = await s3Client.send(new DeleteObjectCommand(params));
            logger.info("File successfully delete")
            resolve("File successfully delete")
        } catch (error) {
            console.log(error)
            reject()
        }
    })
}