const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
function EmailService(receiver, sender) {
    this.receiver = receiver;
    this.sender = sender;

    console.log(receiver, sender);

    this.sendEmail = async () => {
        // let testAccount = await nodemailer.createTestAccount();
        console.log('start sending');
        let transporter = nodemailer.createTransport({
            service: 'gmail',// true for 465, false for other ports
            port: 587,
            auth: {
                user: process.env.GMAIL_USER, // generated ethereal user
                pass: process.env.GMAIL_PASS, // generated ethereal password
            },
            secure: true,
        });

        // send mail with defined transport object
        transporter.sendMail({
            from: this.sender, // sender address
            to: this.receiver, // list of receivers
            subject: "You have signed up successfully", // Subject line
            text: `Dear ${this.receiver}`, // plain text body
            html: `<div>
            <h1>IMPORTANT TEST MAILER</h1>
            <h2>Thank you for your joining to our service</h2><br/>
            <p>I'm glad to see your joining to our service, any support you can call for investiate and supports</p></div>`, // html body
        }, (err, info) => {
            if (err) throw new Error('Your email is not existed');
            console.log('info', info.messageId, info.response);
        });
    }

}


module.exports = EmailService;