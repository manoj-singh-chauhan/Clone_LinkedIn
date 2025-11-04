// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import User from "../modules/auth/user.model";

// const JWT_SECRET = process.env.JWT_SECRET;

// interface AuthRequest extends Request {
//   user?: any;
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
//     const user = await User.findOne({ where: { id: decoded.id } });

//     if (!user) {
//       return res.status(401).json({ error: "Unauthorized. User not found." });
//     }

//     req.user = user;       // full user object
//     (req as any).userId = user.id;  //  add this for controllers

//     next();
//   } catch (err: any) {
//     return res.status(401).json({ error: "Unauthorized. Invalid token." });
//   }
// };


import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// User model ko import karne ki zaroorat nahi hai!
// import User from "../modules/auth/user.model";

const JWT_SECRET = process.env.JWT_SECRET;

interface AuthRequest extends Request {
  user?: any; // Isse { id: number, email: string, name: string | null } kar dein toh behtar hai
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Token missing." });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET!);

    // --- YEH HAI CHANGE ---
    // Ab database call nahi karni
    // const user = await User.findOne({ where: { id: decoded.id } });
    // if (!user) { ... }

    // Seedha token ke data ko attach karein
    req.user = decoded; // 'decoded' mein { id, email, name, iat, exp } sab hai
    (req as any).userId = decoded.id; // Controllers ke liye userId

    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
};