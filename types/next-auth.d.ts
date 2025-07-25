import { DefaultSession, DefaultUser } from "next-auth";
import { AdapterUser as CoreAdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      role: string; // Assuming UserRole is a string
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: string; // Assuming UserRole is a string
    emailVerified?: Date | null;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser extends CoreAdapterUser {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string; // Assuming UserRole is a string
  }
} 