import DataLoader from 'dataloader';
import type { PrismaClient, User, Post, Profile, MemberType } from '@prisma/client';

export const createDataLoaders = (prisma: PrismaClient) => {
  const userLoader = new DataLoader<string, User | null>(async (ids) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));
    return ids.map((id) => userMap.get(id) || null);
  });

  const profileLoader = new DataLoader<string, Profile | null>(async (ids) => {
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: [...ids] } },
    });
    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
    return ids.map((id) => profileMap.get(id) || null);
  });

  const postsLoader = new DataLoader<string, Post[]>(async (ids) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: [...ids] } },
    });
    const postsMap = new Map<string, Post[]>();
    posts.forEach((post) => {
      if (!postsMap.has(post.authorId)) {
        postsMap.set(post.authorId, []);
      }
      postsMap.get(post.authorId)!.push(post);
    });
    return ids.map((id) => postsMap.get(id) || []);
  });

  const memberTypeLoader = new DataLoader<string, MemberType | null>(async (ids) => {
    const memberTypes = await prisma.memberType.findMany({
      where: { id: { in: [...ids] } },
    });
    const memberTypeMap = new Map(memberTypes.map((mt) => [mt.id, mt]));
    return ids.map((id) => memberTypeMap.get(id) || null);
  });

  const userSubscribedToLoader = new DataLoader<string, User[]>(async (ids) => {
    const subscriptions = await prisma.subscribersOnAuthors.findMany({
      where: { subscriberId: { in: [...ids] } },
      include: { author: true },
    });
    const subscriptionsMap = new Map<string, User[]>();
    subscriptions.forEach((sub) => {
      if (!subscriptionsMap.has(sub.subscriberId)) {
        subscriptionsMap.set(sub.subscriberId, []);
      }
      subscriptionsMap.get(sub.subscriberId)!.push(sub.author);
    });
    return ids.map((id) => subscriptionsMap.get(id) || []);
  });

  const subscribedToUserLoader = new DataLoader<string, User[]>(async (ids) => {
    const subscriptions = await prisma.subscribersOnAuthors.findMany({
      where: { authorId: { in: [...ids] } },
      include: { subscriber: true },
    });
    const subscriptionsMap = new Map<string, User[]>();
    subscriptions.forEach((sub) => {
      if (!subscriptionsMap.has(sub.authorId)) {
        subscriptionsMap.set(sub.authorId, []);
      }
      subscriptionsMap.get(sub.authorId)!.push(sub.subscriber);
    });
    return ids.map((id) => subscriptionsMap.get(id) || []);
  });

  return {
    userLoader,
    profileLoader,
    postsLoader,
    memberTypeLoader,
    userSubscribedToLoader,
    subscribedToUserLoader,
  };
};
