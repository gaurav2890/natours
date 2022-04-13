const nodemailer = require('nodemailer');

const sendEmails = async options => {
  // 1) Create a Transpoorter
  const transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'bd026eb143208e',
      pass: '2fea569510c4bd'
    }
  });

  // 2) Define the Email options  -- some options for Email (message , from whom , to whom , body)

  const mailOptions = {
    from: 'gaurav goyal <garvgyl16@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // 3) Actually send the email  => it return Promise
  await transport.sendMail(mailOptions);
};
module.exports = sendEmails;
