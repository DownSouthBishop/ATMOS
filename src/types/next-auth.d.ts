import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      o2Balance: number;
    };
  }

  interface User {
    id: string;
    o2Balance: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    o2Balance: number;
  }
}
