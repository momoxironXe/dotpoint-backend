import config from 'config'
import nodemailer from "nodemailer"

const nodeMail: any = config.get('nodeMail')

export const mailSend = (mail: any, subject: any, text: any, htmlData: any) => {
    return new Promise((resolve, reject) => {
        if (mail) {
            let mailTransporter = nodemailer.createTransport({
                tls: {
                    ciphers: "SSLv3",
                },
                requireTLS: true,
                port: 465,
                debug: true,
                host: nodeMail.host,
                service: nodeMail.service,
                auth: {
                    user: nodeMail.mail,
                    pass: nodeMail.password
                }
            });

            let mailDetails = {
                from: nodeMail.mail,
                to: mail,
                subject: subject,
                text: text,
                html: htmlData,
            };

            mailTransporter.sendMail(mailDetails, function (err, data) {
                if (err) {
                    console.log(err)
                    reject(err);
                } else {
                    console.log('Email sent: ' + data.response)
                    resolve(data.response);
                }
            });
        }
    })
}

// (async () => {
//     await mailSend("mukund.semicolon@gmail.com", "Account created", `${"MK"} your account successfully created`)
// })()