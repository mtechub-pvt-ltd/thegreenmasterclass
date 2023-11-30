import { Router } from 'express';
import { ResetPasswordLinkValidate, SingleUser, UnblockUser, blockUser, changePassword, checkEmail, checkoutSession, createPayment, createUser, forgetPassword, getAllDashboardStats, getAllUsers, getUserProfile, login, resetPassword, verifyOtp, verifyToken, webhook } from '../controller/userController.js';
import { verification } from '../middleware/TokenVerification.js';
const userRoute = Router();
userRoute.post('/createUserAccount', createUser);
userRoute.post('/createPaymentIntent', createPayment);
userRoute.post('/checkoutSession', checkoutSession);
userRoute.get('/verifyToken', verifyToken);
userRoute.post('/login', login);
userRoute.post("/forgetPassword",forgetPassword)
userRoute.post("/verifyOtp",verifyOtp)
userRoute.post("/reset_password/:id/:token",resetPassword)
userRoute.post("/validate_reset_password_link",ResetPasswordLinkValidate)
userRoute.post('/checkEmailPhone', checkEmail);
userRoute.put('/change_password',verification, changePassword);
userRoute.get('/getUserProfile/:id', getUserProfile);
userRoute.get('/getAllUsers',verification, getAllUsers);
userRoute.get("/getUserById/:id",SingleUser)
userRoute.post("/blockUser",blockUser)
userRoute.post("/UnBlockUser",UnblockUser)
userRoute.get("/getAllDashboardStats",getAllDashboardStats)
userRoute.post("/webhook",webhook)
// export const register = async (req, res) => {
//     const { email, password, confirmPassword,device_id } = req.body;
  
//     try {
//       if (password !== confirmPassword) {
//         return res.status(401).json({
//           statusCode: 401,
//           message: "Password and ConfirmPassword not matched",
//         });
//       }
//       await pool.query('BEGIN'); // Start a transaction
//       const existingUserResult = await pool.query(userEmailExistQuery, [email]);
  
//       if (existingUserResult.rows.length > 0) {
//         await pool.query('ROLLBACK'); // Roll back the transaction
//         return res
//           .status(401)
//           .json({ statusCode: 401, message: "Email is already in use" });
//       }
//       const hashedPassword = await bcrypt.hash(password, 10);
//       const insertUserQuery =
//         "INSERT INTO users (email, password,device_id) VALUES ($1, $2,$3) RETURNING *";
//       const newUserResult = await pool.query(insertUserQuery, [
//         email,
//         hashedPassword,
//         device_id
//       ]);
//       const userId = newUserResult.rows[0].id;
//       await pool.query('COMMIT'); // Commit the transaction
//       const token = jwt.sign({ userId }, process.env.SECRET_KEY, {
//         expiresIn: "24h",
//       });
  
//       res
//         .status(201)
//         .json({ statusCode: 200, newUser: { 
//           id:userId,
//           device_id:newUserResult.rows[0].device_id,
//           token,
//           username:newUserResult.rows[0].username,
//           email:newUserResult.rows[0].email,
//           image:newUserResult.rows[0].image,
//           blocked:newUserResult.rows[0].blocked,
//           createdAt:newUserResult.rows[0].createdAt,
//           updatedAt:newUserResult.rows[0].updatedAt, } });
//     } catch (error) {
//       await pool.query('ROLLBACK');
//       console.error(error);
//       res.status(500).json({ statusCode: 500, message: "Internal server error",error:error.stack });
//     }finally {
//       await pool.query('END'); // End the transaction
//     }
//   };
export default userRoute;
