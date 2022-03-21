const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
function EmailService(receiver, sender) {
    this.receiver = receiver;
    this.sender = sender;

    this.sendEmail = async (htmlContent) => {
        // let testAccount = await nodemailer.createTestAccount();
        let transporter = await nodemailer.createTransport({
            service: 'gmail',// true for 465, false for other ports
            port: 587,
            auth: {
                user: process.env.GMAIL_USER, // generated ethereal user
                pass: process.env.GMAIL_PASS, // generated ethereal password
            },
            secure: true,
        });

        // send mail with defined transport object
        return new Promise((resolve, reject) => {
            transporter.sendMail({
                from: this.sender, // sender address
                to: [this.receiver, "trungtinh246810f@thienhb.onmicrosoft.com"], // list of receivers
                subject: "Your CV has been accepted", // Subject line
                text: `Dear ${this.receiver}`, // plain text body
                html: htmlContent || `<div>
                <h1>WELCOME YOU BECOMING OUR NEW MEMBER</h1>
                <h2>Dear ${this.receiver}.</h2><br/>
                <p>Your join are a great good to us!</p>
                <i>Any request you can call for investigate and supports by email: <b>tinhntgcd18753@fpt.edu.vn</b></i>
                </div>`, // html body
            }, (err, info) => {
                if (err) {
                    const error = new Error('Your email is not existed');
                    reject(error);
                }
                resolve(info);
            });
        })
    }

}


module.exports = EmailService;