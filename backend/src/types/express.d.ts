export {};

declare global {
  namespace Express {
    interface Request {
      auth:
        | {
            session: {
              id: string;
              userId: string;
              expiresAt: string | Date;
              token: string;
              [key: string]: unknown;
            };
            user: {
              id: string;
              email: string;
              name: string;
              [key: string]: unknown;
            };
          }
        | null;
    }
  }
}
