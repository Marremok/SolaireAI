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

    const dbUser = await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.emailAddresses[0]?.emailAddress ?? "",
        phone: user.phoneNumbers[0]?.phoneNumber,
      },
      create: {
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