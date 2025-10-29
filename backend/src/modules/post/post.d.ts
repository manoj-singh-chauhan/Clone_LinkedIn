import { Request } from "express";
import "multer"; 

declare global {
  interface AuthenticatedRequest extends Request {
    userId?: number;
    files?:
      | { [fieldname: string]: Express.Multer.File[] }
      | Express.Multer.File[];
  }
}

// import { Request } from "express";

// declare global {
//   interface AuthenticatedRequest extends Request {
//     userId?: number;
//   }
// }
