export const commonEmailTemplate = async ({ title, sub_html }: any) => {
    return `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>template email</title>
        <style>
        table,
        th,
        th,
        td {
            padding: 0 8px;
        }

        .floatLeft {
            float: left;
            width: 50%;
        }

        .floatRight {
            float: right;
            width: 50%;
        }

        .listTitle-li::before {
            content: "";
            width: 12px;
            height: 12px;
            background: #00503b;
            position: absolute;
            left: -19px;
            top: 2px;
            border-radius: 50%;
        }

        @media (max-width:320px) {
            .main_button {
                padding: 8px 10px !important;
                font-size: 10px !important;
            }
        }

        @media (max-width:481px) {
            .main_button {
                padding: 8px 24px !important;
                font-size: 14px !important;
            }
        }

        .logoImg {
            height: 120px;
            width: 250px;
            margin: 10px 32px 0 0;
        }

        .headerDiv {
            text-align: right;
            background-image: url('https://properties-storage-files.s3.me-south-1.amazonaws.com/background+image.jpg');
            height: auto;
            background-size: cover;
            margin: 0;
        }

        .footerDiv {
            padding: 20px 0 30px 0;
            background-image: url('https://properties-storage-files.s3.me-south-1.amazonaws.com/background+image.jpg');
            background-size: cover;
        }

        @media (max-width:568px) {
            .logoImg {
                height: 80px;
                width: 170px;
            }

            .headerDiv {
                height: 93px;
            }

            .floatLeft {
                float: unset;
                width: 100%;
            }

            .floatLeft ul,
            .floatRight ul {
                margin: 0 !important;
            }

            .floatRight {
                float: unset;
                width: 100%;
            }

            .footerDiv {
                padding: 20px 0 30px 0;
            }
        }
    </style>
    </head>
    
    <body style="font-family: Helvetica;">
        <div style="background-color: #e4e4e4;background-size: cover;margin: 0;padding: 0 0 20px 0;">
            <div style="max-width: 768px; margin: auto;background-color: white;padding: 0 0 0 0;">
                <div class="headerDiv">
                    <img src="https://api.propertise.com/images/brand_full_logo.png" width="260x" class="logoImg" alt="">
                </div>
                <div>
                    <h2 style="padding: 0px 25px;">${title}
                    </h2>
                    ${sub_html}
                    <div style="padding: 10px 0 0 0"></div>
                    <div class="footerDiv">
                        <div style="max-width: 170px;margin:auto; ">
                            <div style="display:flex;">
                                <img src="https://properties-storage-files.s3.me-south-1.amazonaws.com/facebook.png"
                                    style="width: 30px;height: 30px;" alt="">
                                <img src="https://properties-storage-files.s3.me-south-1.amazonaws.com/insta.png"
                                    style="width: 30px;height: 30px;margin: auto;" alt="">
                                <img src="https://properties-storage-files.s3.me-south-1.amazonaws.com/linkin.png"
                                    style="width: 30px;height: 30px;" alt="">
                            </div>
                            <div style="text-align: center;margin-top: 15px;color: rgb(255, 255, 255);">Propertise.com</div>
                            <div style="text-align: center;margin-top: 10px;color: rgb(255, 255, 255);">© 2023.All right
                                reserved.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`
}