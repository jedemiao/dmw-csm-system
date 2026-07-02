"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "./password";
import { createSession } from "./session";

export type LoginState = { error: string | null };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const genericError = { error: "Invalid email or password." };

  if (!user || !user.isActive) return genericError;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return genericError;

  const headerStore = await headers();
  await createSession(user.id, {
    userAgent: headerStore.get("user-agent") ?? undefined,
    ipAddress: headerStore.get("x-forwarded-for") ?? undefined,
  });

  redirect("/admin");
}
