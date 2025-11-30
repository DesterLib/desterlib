import { z } from "zod";

declare global {
  namespace Express {
    interface Request {
      validatedData?: z.infer<z.ZodTypeAny>;
    }
  }
}
