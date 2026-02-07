"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";

export interface UserStats {
  exams: number
}

export async function syncUser() {
  try {
    const user = await currentUser();
    if (!user) return;

    const existingUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.emailAddresses[0]?.emailAddress ?? "",
        phone: user.phoneNumbers[0]?.phoneNumber,
      },
    });

    return dbUser;
  } catch (error) {
    console.log("Error in syncUser server action", error);
  }
}

export async function getUserStats() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { exams: true },
  });

  return dbUser;
}