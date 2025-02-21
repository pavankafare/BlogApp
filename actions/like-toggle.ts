"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const toggleLike = async (articleId: string) => {
  // Ensure the user is logged in before liking an article
  const { userId } = await auth();
  if (!userId) throw new Error("You must be logged in to like an article");

  // Ensure the user exists in the database
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User does not exist in the database.");
  }
  const existingLike = await prisma.like.findFirst({
    where: { articleId, userId: user.id }, // Use `user.id`, not `clerkUserId`
  });
  if (existingLike) {
    // Unlike the article
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    // Like the article
    await prisma.like.create({
      data: { articleId, userId: user.id },
    });
  }

  // Return updated like count
  revalidatePath(`/article/${articleId}`);
};

export default toggleLike;
