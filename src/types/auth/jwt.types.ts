export type AppJwtPayload = {
  id: number | string;
  username: string;
  permissions?: string[];
  roles?: string[];
  exp?: number;
};
