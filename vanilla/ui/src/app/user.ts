export class User {
  authorities: string[];
  details: {
    remoteAddress: string;
    sessionId: string;
  };
  authenticated: boolean;
  principal: {
    password: string;
    user: string;
    authorities: string[];
    accountNonExpired: boolean;
    accountNonLocked: boolean;
    credentialsNonExpired: boolean;
    enabled: boolean;
  };
  credentials: string[];
  name: string;
}
