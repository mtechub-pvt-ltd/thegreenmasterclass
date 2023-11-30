import nodemailer from "nodemailer";
export const emailSent = (email, output,subject) => {
    return new Promise((resolve, reject) => {
      var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // use SSL
        service: "gmail",
        auth: {
          user: "thegreenmasterclass@gmail.com",
          // user: "rafaymuhammad245@gmail.com",
          pass: "uxsfhtbffltyxril",
        },
      });
      var mailOptions = {
        from: "thegreenmasterclass@gmail.com",
        to: email,
        subject: subject,
        html: output,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          console.log("Email sent: " + info.response);
          resolve(true);
        }
      });
    });
  };