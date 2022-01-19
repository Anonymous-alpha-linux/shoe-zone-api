const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
function EmailService(receiver, sender) {
    this.receiver = receiver;
    this.sender = sender;
    if (typeof receiver === 'string') {
        this.receiver.email = receiver;
        this.receiver.name = receiver;
    }

    if (typeof sender === 'string') {
        this.sender.name = sender;
    }
}


EmailService.send = async () => {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: true, // true for 465, false for other ports
        auth: {
            user: 'tinhntgcd18753@fpt.edu.vn', // generated ethereal user
            pass: '123@123a', // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: this.sender.name, // sender address
        to: this.receiver.email, // list of receivers
        subject: "You have signed up successfully", // Subject line
        text: `Dear ${this.receiver.name}`, // plain text body
        html: "<p>Thank you for your joining to our service</p>", // html body
    });

    // console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

module.exports = EmailService;