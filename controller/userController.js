import Stripe from "stripe";
import { convertToSmallestUnit } from "../utils/paymentUtilities.js";
import { generateRandomPassword } from "../utils/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.config/index.js";
import { emailSent } from "../utils/EmailSent.js";
import session from 'express-session'
const stripe = new Stripe(
  "sk_test_51Ml3wJGui44lwdb4hcY6Nr91bXfxAT2KVFXMxiV6ridW3LCMcB6aoV9ZAQxL3kDjaBphiAoga8ms0zbUiQjbZgzd00DpMxrLNL"
);
const createPaymentIntent = async (amount, currency, customer, metadata) => {
  try {
    const amountInSmallestUnit = convertToSmallestUnit(amount, currency);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency,
      customer: customer,
      metadata: metadata,
    });
    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const createPayment = async (req, res) => {
  const { amount, currency } = req.body;
  const metadata = {};

  try {
    const customer = await stripe.customers.create();
    const paymentIntent = await createPaymentIntent(
      amount,
      currency.toUpperCase(),
      customer.id,
      metadata
    );
    res.status(200).json(paymentIntent);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
export const checkoutSession = async (req, res) => {
  const { values, quantity, customerEmail } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1NwdzWGui44lwdb4kGWlVESn', // Replace with the actual Price ID
          quantity: quantity,
        },
      ],
      
      mode: 'payment',
      success_url: 'http://localhost:5173/thank-you',
      cancel_url: 'http://localhost:5173/checkout',
      customer_email: customerEmail,
    });
     // Assign session data
     req.session.fullname = values.first_name;
     req.session.email = values.email;
     req.session.phone_no = values.phone_no;
 
     // Save the session
     req.session.save((err) => {
         if (err) {
             console.error('Error saving session:', err);
         } else {
             console.log('Session data saved successfully');
         }
     });
 
     // You can access session data after it's assigned
     const sessionEmail = req.session;
     console.log('Session Email:', sessionEmail);
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
export const createUser = async (req, res) => {
  const {
    // fullname,
    email,
    // phone_no,
    // address,
    // city,
    // zip_code,
    // payment_details,
  } = req.body;
  try {
  
    const randomPassword = generateRandomPassword(8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const userInfoQuery = `INSERT INTO users (email,password,role) values($1,$2,$3) RETURNING *`;
    // const billingQuery = `INSERT INTO billing (user_id,address,city,zip_code) values($1,$2,$3,$4)`;
    const paymentQuery = `INSERT INTO payment (user_id,payment_details) values($1,$2)`;
    const createdUser = await pool.query(userInfoQuery, [
      // fullname,
      email,
      // phone_no,
      hashedPassword,
      "user",
    ]);
    if (createdUser.rows.length === 0) {
      return res
          .status(400)
          .json({
            statusCode: 400,
            message: "User not created",
          });
    }
      // const payment_details_Result = await pool.query(paymentQuery, [
      //   createdUser.rows[0].id,
      //   payment_details,
      // ]);
      // if (
      //   payment_details_Result.rowCount === 0
      // ) {
      //   return res
      //     .status(400)
      //     .json({
      //       statusCode: 400,
      //       message: "User created but Information not saved ",
      //     });
      // }
      const output = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Congratulations on Your Payment</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h2 {
              color: rgba(29, 191, 115, 1);
              margin-bottom: 20px;
            }
            a{
              color:white;
            }
            p {
              margin-bottom: 10px;
            }
            .button {
              cursor:pointer;
              display: inline-block;
              font-weight: 600;
              color: #ffffff;
              background-color: rgba(29, 191, 115, 1);
              border: 1px solid rgba(29, 191, 115, 1);
              border-radius: 2px;
              padding: 10px 20px;
              text-decoration: none;
              transition: background-color 0.3s ease;
            }
            .button:hover {
              background-color: #1dbf73;
              color: #ffffff;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Congratulations on Your Payment!</h2>
            <p>Hello,</p>
            <p>We are delighted to inform you that your payment has been successfully processed.</p>
            <p>Your user portal credentials are as follows:</p>
            <ul>
              <li>Use this Webiste URL for login: <a href="${process.env.USER_PORTAL_LOGIN_URL}">Go to Website</a></li>
              <li>Email: ${createdUser.rows[0].email}</li>
              <li>Password: ${randomPassword}</li>
            </ul>
           
            <p class="footer">Thank you for choosing our service!</p>
          </div>
        </body>
        </html>
        `;
      await emailSent(createdUser.rows[0].email, output, "Wellcome email");
      const token = jwt.sign(
        { userId: createdUser.rows[0].id },
        process.env.SECRET_KEY,
        {
          expiresIn: "7d",
        }
      );
      res.status(200).json({
        statusCode: 200,
        user: {
          id: createdUser.rows[0].id,
          token,
          // fullname: createdUser.rows[0].fullname,
          // phone_no: createdUser.rows[0].phone_no,
          email: createdUser.rows[0].email,
          role: createdUser.rows[0].role,
        },
      });
    }
   catch (error) {
    console.log(error);
    // const deleteQuery=`DELETE FROM users WHERE email=$1 `
    // await pool.query(deleteQuery,[email])

    res.status(500).json({ error });
  }
};
export const webhook = async (request, response) => {
  const event = request.body;
  console.log(event);
  console.log(event.data.object);
  switch (event.type) {
    case "checkout.session.completed":
      const paymentIntent = event.data.object;
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case "payment_intent.succeeded":
      console.log(
        "--------------------------------------------------------------------------------"
      );
      // const paymentMethod = event.data.object;
      // const { metadata } = paymentMethod;
      // const userId = metadata.userId;
      // const paymentExpireDate = getDateAfter30Days();
      // const userObj = await userModel.updateOne(
      //   { _id: userId },
      //   {
      //     $set: {
      //       membership: "premium",
      //       paymentSuccessful: true,
      //       paymentExpireDate: paymentExpireDate,
      //     },
      //   }
      // );
      // if (userObj) {
      //   cron.schedule("* * * */30 * *", () => executeAfter30Days(userId));
      // }

      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    // ... handle other event types
    case "charge.succeeded":
      // const pMethod = event.data.object;
      // const { customer, payment_method } = pMethod;
      // const uId = pMethod.metadata.userId;
      // const paymentObj = new PaymentsModel({
      //   customerId: customer,
      //   paymentMethodId: payment_method,
      //   userId: uId,
      // });
      // await paymentObj.save();
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
};
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization; // Assuming the token is in the 'Authorization' header
  if (!token && !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const authToken = token.slice(7);
  jwt.verify(authToken, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    // Token is valid, you can optionally include the decoded user information in the request
    req.user = decoded;
    // Return a 200 OK response when the token is valid
    return res.status(200).json({ message: "Token is valid" });
  });
};
export const login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const userEmailExistQuery = "SELECT * FROM users WHERE email=$1";
    const { rows } = await pool.query(userEmailExistQuery, [email]);
    if (
      rows.length === 0 ||
      !(await bcrypt.compare(password, rows[0].password)) ||
      rows[0].role !== role
    ) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: rows[0].id }, process.env.SECRET_KEY, {
      expiresIn: "24h",
    });
    res.status(200).json({
      statusCode: 200,
      user: {
        id: rows[0].id,
        token,
        fullname: rows[0].fullname,
        email: rows[0].email,
        phone_no: rows[0].phone_no,
        createdAt: rows[0].createdAt,
        updatedAt: rows[0].updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userEmailExistQuery = "SELECT * FROM users WHERE email=$1";
    const userEmailExistResult = await pool.query(userEmailExistQuery, [email]);
    if (userEmailExistResult.rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Invalid Email" });
    }
    const otpCode = Math.floor(1000 + Math.random() * 9000);
    const updateQuery = "UPDATE users SET code =$1 WHERE email=$2";
    const updateQueryResult = await pool.query(updateQuery, [otpCode, email]);
    if (updateQueryResult.rowCount === 1) {
      const output = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Green Masterclass - OTP Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: rgb(29, 191, 115);
                    color: #fff;
                }
        
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 4px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
        
                h2 {
                    color: rgb(29, 191, 115);
                    margin-bottom: 20px;
                }
        
                p {
                    margin-bottom: 10px;
                }
        
                .otp-code {
                    font-size: 24px;
                    font-weight: bold;
                    color: rgb(29, 191, 115);
                }
        
                .button {
                    display: inline-block;
                    font-weight: 600;
                    background-color: rgb(29, 191, 115);
                    border: 1px solid rgb(29, 191, 115);
                    border-radius: 2px;
                    padding: 10px 20px;
                    color: #fff;
                    text-decoration: none;
                    transition: background-color 0.3s ease;
                }
        
                .button:hover {
                    background-color: #1d7739;
                }
        
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #333;
                }
            </style>
        </head>
        <body>
        <div class="container">
            <h2>Green Masterclass - OTP Verification</h2>
            <p>Hello,</p>
            <p>We have sent you a one-time password (OTP) for verification. Please use the OTP code below:</p>
            <p class="otp-code">${otpCode}</p>
            <p>If you did not request this OTP, please ignore this email.</p>
            <p class="footer">Thank you for choosing Green Masterclass!</p>
        </div>
        </body>
        </html>
        
              `;
      await emailSent(email, output, "Verification Code");
      res.status(200).json({
        statusCode: 200,
        message: "Reset password link sent successfully!",
      });
    } else {
      res.status(400).json({
        statusCode: 400,
        message: "Reset passord link not sent",
      });
    }
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};
export const verifyOtp = async (req, res, next) => {
  try {
    const { code, email } = req.body;
    const veritOtpQuery =
      "UPDATE users SET code=$1 WHERE email=$2 AND code=$3 RETURNING *";
    const VerifyResult = await pool.query(veritOtpQuery, [null, email, code]);
    if (VerifyResult.rowCount === 1) {
      const token = jwt.sign(
        { email, id: VerifyResult.rows[0].id },
        process.env.SECRET_KEY + VerifyResult.rows[0].password,
        { expiresIn: "150m" }
      );
      return res.status(200).json({
        statusCode: 200,
        message: "Otp Code verify successfully",
        userId: VerifyResult.rows[0].id,
        token: token,
      });
    }
    return res
      .status(401)
      .json({ statusCode: 401, message: "Invalid Otp Code" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};
export const ResetPasswordLinkValidate = async (req, res, next) => {
  const { id, token } = req.body;
  console.log(req.body);
  const userQuery = `SELECT * FROM users WHERE id=$1`;
  const userResult = await pool.query(userQuery, [id]);
  if (userResult.rows.length === 0) {
    return res.status(401).json({ statusCode: 400, message: "Invalid Link" });
  }

  const secret = process.env.SECRET_KEY + userResult.rows[0].password;

  try {
    const payload = jwt.verify(token, secret);

    if (!payload) {
      return res.status(401).json({ statusCode: 401, message: "Link Expire" });
    }

    return res.status(200).json({ status: 200, message: "Valid Link" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, error, message: "Server error" });
  }
};
export const resetPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword, role, id, token } = req.body;
    console.log(req.body);
    if (password !== confirmPassword) {
      return res.status(401).json({
        statusCode: 401,
        message: "Password and confirm password not matched",
      });
    }
    const userEmailExistQuery = "SELECT * FROM users WHERE   role=$1 AND id=$2";
    const userEmailExistResult = await pool.query(userEmailExistQuery, [
      role,
      id,
    ]);
    if (userEmailExistResult.rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "User not exist" });
    }
    const secret =
      process.env.SECRET_KEY + userEmailExistResult.rows[0].password;
    const payload = jwt.verify(token, secret);
    if (!payload) {
      return res.status(401).json({ status: 401, message: "Link Expired" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateQuery = "UPDATE users SET password=$1 WHERE id=$2";
    const updateResult = await pool.query(updateQuery, [hashedPassword, id]);
    if (updateResult.rowCount === 1) {
      return res
        .status(200)
        .json({ statusCode: 200, message: "Password reset successfully" });
    }

    return res
      .status(401)
      .json({ statusCode: 401, message: "Password not updated" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};
export const changePassword = async (req, res) => {
  const { id, currentPassword, newPassword, role } = req.body;
  try {
    const userEmailExistQuery = "SELECT * FROM users WHERE id=$1";
    const { rows } = await pool.query(userEmailExistQuery, [id]);
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "User not found" });
    }
    if (
      !(await bcrypt.compare(currentPassword, rows[0].password)) ||
      rows[0].role !== role
    ) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Current password invalid" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = `UPDATE users SET password=$1 WHERE id=$2`;
    const updateResult = await pool.query(updateQuery, [hashedPassword, id]);
    if (updateResult.rowCount === 0) {
      return res
        .status(401)
        .json({ statusCode: 400, message: "Operation not successfull" });
    }

    res
      .status(200)
      .json({ statusCode: 200, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT
      u.id AS user_id,
      u.fullname,
      u.email,
      u.phone_no,
      p.payment_details,
      p.created_at AS payment_created
  FROM
      users AS u
  LEFT JOIN
      payment AS p ON u.id = p.user_id
      WHERE u.id=$1
  `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length) {
      return res.status(200).json({ statusCode: 200, user: rows[0] });
    } else {
      res.status(404).json({ statusCode: 404, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const checkEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const userEmailExistQuery = "SELECT * FROM users WHERE email=$1";
    const { rows } = await pool.query(userEmailExistQuery, [email]);
    if (rows.length > 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Email already registered" });
    }
    res.status(200).json({ statusCode: 200 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const userQuery = `SELECT
      u.id AS user_id,
      u.fullname,
      u.email,
      u.phone_no,
      u.role,
      u.code,
      u.isBlocked,
      p.payment_details,
      p.created_at AS payment_created
  FROM
      users u
  LEFT JOIN
      payment p ON u.id = p.user_id
  ORDER BY
      u.id;
  `;
    const { rows } = await pool.query(userQuery);
    console.log(rows);
    res
      .status(200)
      .json({ statusCode: 200, totalUsers: rows.length, AllUsers: rows });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        statusCode: 500,
        message: "Internal server error",
        error: error.stack,
      });
  }
};
export const SingleUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userQuery = `
  SELECT
      u.id AS user_id,
      u.fullname,
      u.email,
      u.phone_no,
      u.role,
      u.code,
      p.payment_details
  FROM
      users u
  LEFT JOIN
      payment p ON u.id = p.user_id
  WHERE
      u.id = $1  -- Specify the table alias 'u' to make it clear
  ORDER BY
      u.id;
`;

    const { rows } = await pool.query(userQuery, [id]);
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "User Not found" });
    }
    res.status(200).json({ statusCode: 200, user: rows[0] });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};
export const blockUser = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    const updateQuery = "UPDATE users SET isBlocked=$1 WHERE id=$2";
    const result = await pool.query(updateQuery, [status, id]);
    if (result.rowCount === 1) {
      return res
        .status(200)
        .json({ statusCode: 200, message: "User block successfully" });
    }
    res
      .status(401)
      .json({ statusCode: 401, message: "User not block due to some error" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};
export const UnblockUser = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    const updateQuery = "UPDATE users SET isBlocked=$1 WHERE id=$2";
    const result = await pool.query(updateQuery, [status, id]);
    if (result.rowCount === 1) {
      return res
        .status(200)
        .json({ statusCode: 200, message: "User Unblock successfully" });
    }
    res
      .status(401)
      .json({ statusCode: 401, message: "User not Unblock due to some error" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};

export const getAllDashboardStats = async (req, res, next) => {
  try {
    // Get the total number of users in the database
    const totalUsersQuery = "SELECT COUNT(*) FROM users";
    const totalUsersResult = await pool.query(totalUsersQuery);

    // Get the total number of videos
    const totalVideosQuery = "SELECT COUNT(*) FROM videos";
    const totalVideosResult = await pool.query(totalVideosQuery);

  // Generate a list of all 12 months
const allMonthsQuery = `
SELECT
  TO_CHAR(DATE '2023-01-01' + (n || ' months')::INTERVAL, 'Mon') AS month
FROM generate_series(0, 11) AS n
`;

// Get the monthly user join data with month names and left join it with all months
const monthlyUserJoinQuery = `
SELECT
  all_months.month,
  COUNT(users.created_at) AS user_count
FROM
  (${allMonthsQuery}) AS all_months
LEFT JOIN
  users
ON
  all_months.month = TO_CHAR(users.created_at, 'Mon')
GROUP BY
  all_months.month
ORDER BY
  EXTRACT(MONTH FROM MIN(users.created_at))
`;

    const monthlyUserJoinData = await pool.query(monthlyUserJoinQuery);

    return res.status(200).json({
      totalUsers: totalUsersResult.rows[0],
      totalVideos: totalVideosResult.rows[0],
      totalEarning:totalUsersResult.rows[0].count*49,
      monthlyUserJoinData:monthlyUserJoinData.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      error: error.message,
      message: "Server error",
    });
  }
};
