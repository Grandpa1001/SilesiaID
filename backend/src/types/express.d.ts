import "express";

declare global {
  namespace Express {
    interface Request {
      institution?: {
        id: number;
        name: string;
        email: string;
      };
    }
  }
}

export {};
