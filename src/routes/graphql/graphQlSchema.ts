import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLEnumType,
} from 'graphql';
import type { PrismaClient } from '@prisma/client';
import { UUIDType } from './types/uuid.js';

export const createSchema = (prisma: PrismaClient) => {
  const PostType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
    }),
  });

  const MemberTypeIdEnum = new GraphQLEnumType({
    name: 'MemberTypeId',
    values: {
      BASIC: { value: 'BASIC' },
      BUSINESS: { value: 'BUSINESS' },
    },
  });

  const MemberType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: new GraphQLNonNull(MemberTypeIdEnum) },
      discount: { type: new GraphQLNonNull(GraphQLFloat) },
      postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
    }),
  });

  const ProfileType = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      memberType: {
        type: MemberType,
        resolve: (source: { memberTypeId: string }) =>
          prisma.memberType.findUnique({
            where: { id: source.memberTypeId },
          }),
      },
    }),
  });

  const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
      profile: {
        type: ProfileType,
        resolve: (source: { id: string }) =>
          prisma.profile.findUnique({
            where: { userId: source.id },
          }),
      },
      posts: {
        type: new GraphQLList(PostType),
        resolve: (source: { id: string }) =>
          prisma.post.findMany({
            where: { authorId: source.id },
          }),
      },
    }),
  });

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        users: {
          type: new GraphQLList(UserType),
          resolve: async () => prisma.user.findMany(),
        },
        user: {
          type: UserType,
          args: {
            id: { type: new GraphQLNonNull(UUIDType) },
          },
          resolve: async (_, { id }) => prisma.user.findUnique({ where: { id } }),
        },
        posts: {
          type: new GraphQLList(PostType),
          resolve: async () => prisma.post.findMany(),
        },
        post: {
          type: PostType,
          args: {
            id: { type: new GraphQLNonNull(UUIDType) },
          },
          resolve: async () => prisma.post.findMany(),
        },
      },
    }),
  });
};
