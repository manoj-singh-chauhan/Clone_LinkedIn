


// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// // User model ko import karne ki zaroorat nahi hai!
// // import User from "../modules/auth/user.model";

// const JWT_SECRET = process.env.JWT_SECRET;

// interface AuthRequest extends Request {
//   user?: any; // Isse { id: number, email: string, name: string | null } kar dein toh behtar hai
// }

// export const authenticate = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized. Token missing." });
//     }

//     const decoded: any = jwt.verify(token, JWT_SECRET!);

//     // --- YEH HAI CHANGE ---
//     // Ab database call nahi karni
//     // const user = await User.findOne({ where: { id: decoded.id } });
//     // if (!user) { ... }

//     // Seedha token ke data ko attach karein
//     req.user = decoded; // 'decoded' mein { id, email, name, iat, exp } sab hai
//     (req as any).userId = decoded.id; // Controllers ke liye userId

//     next();
//   } catch (err: any) {
//     return res.status(401).json({ error: "Unauthorized. Invalid token." });
//   }
// };



import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// import User from "../modules/auth/user.model"; // <-- Ab iski zaroorat nahi hai

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set.");
}

// 1. Token ke data ka structure (Payload)
// Ismein woh sab kuch hai jo humne login ke time token mein daala tha
interface JwtPayload {
  id: number;
  email: string;
  name: string | null;
  iat: number; // Issued at (JWT standard)
  exp: number; // Expiry (JWT standard)
}

// --- YEH HAI AAPKA FIX ---
// 2. Is interface ko 'export' karein taaki controllers ise import kar sakein
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload; // Token se mila poora data
  userId?: number;  // Sirf ID, controllers ke liye
}
// --- END FIX ---

export const authenticate = async (
  req: AuthenticatedRequest, // 3. Yahaan naya type istemaal karein
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Token missing." });
    }

    // Token ko verify karein aur type-cast karein
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // --- YEH AAPKA OPTIMIZATION HAI ---
    // Database call ko poori tarah hata diya gaya hai
    // const user = await User.findOne({ where: { id: decoded.id } });
    // if (!user) { ... }

    // 4. Seedha token ke 'decoded' data ko request par attach karein
    req.user = decoded;       // Poora user data { id, email, name }
    req.userId = decoded.id;  // Aapke controllers ke liye

    next();
  } catch (err: any) {
    // Agar token invalid ya expire ho gaya hai, toh JWT error dega
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
};