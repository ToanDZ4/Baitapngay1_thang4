const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "5ee4d3b9e076b9",
        pass: "884e17b40c1b54",
    },
});

module.exports = {
    sendMail: async (to,url) => {
        const info = await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "RESET PASSWORD REQUEST",
            text: "lick vo day de doi pass", // Plain-text version of the message
            html: "lick vo <a href="+url+">day</a> de doi pass", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordMail: async (to, password) => {
        const info = await transporter.sendMail({
            from: '"Admin" <admin@haha.com>',
            to: to,
            subject: "Mật khẩu hệ thống mới của bạn",
            text: `Chào bạn, mật khẩu đăng nhập của bạn là: ${password}`, 
            html: `<b>Chào bạn,</b><br/>Mật khẩu đăng nhập vào hệ thống của bạn là: <strong>${password}</strong><br/>Vui lòng đăng nhập và bảo vệ tài khoản của bạn.`,
        });

        console.log("Message sent:", info.messageId);
    }
}