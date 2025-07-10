export interface AuthenticatedRequest {
  user: {
    _id: string;
    email: string;
    role: string;
  };
}
