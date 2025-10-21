// Extend Express Request interface with our custom properties
declare global {
  namespace Express {
    interface Request {
      // Validation middleware adds this property
      validatedData?: unknown;
      // Auth user property goes here
    }
  }

  namespace NodeJS {
    interface Process {
      pkg?: {
        entrypoint: string;
        defaultEntrypoint: string;
      };
    }
  }
}

export {};
