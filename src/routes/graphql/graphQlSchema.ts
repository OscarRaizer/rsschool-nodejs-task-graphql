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
  GraphQLInputObjectType,
} from 'graphql';
import type {
  PrismaClient,
  User,
  Post,
  Profile,
  MemberType as PrismaMemberType,
} from '@prisma/client';
import { UUIDType } from './types/uuid.js';
import type {
  CreateUserInputType,
  ChangeUserInputType,
  CreatePostInputType,
  ChangePostInputType,
  CreateProfileInputType,
  ChangeProfileInputType,
} from './types/data.js';
import type { createDataLoaders } from './dataLoaders.js';

type DataLoaders = ReturnType<typeof createDataLoaders>;
type Context = { dataLoaders: DataLoaders };

export const createSchema = (prisma: PrismaClient) => {
  const PostType: GraphQLObjectType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
    }),
  });

  const MemberTypeIdEnum: GraphQLEnumType = new GraphQLEnumType({
    name: 'MemberTypeId',
    values: {
      BASIC: { value: 'BASIC' },
      BUSINESS: { value: 'BUSINESS' },
    },
  });

  const MemberType: GraphQLObjectType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: new GraphQLNonNull(MemberTypeIdEnum) },
      discount: { type: new GraphQLNonNull(GraphQLFloat) },
      postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
    }),
  });

  const ProfileType: GraphQLObjectType = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      memberType: {
        type: MemberType,
        resolve: async (
          source: Profile,
          _,
          context: Context,
        ): Promise<PrismaMemberType | null> =>
          context.dataLoaders.memberTypeLoader.load(source.memberTypeId),
      },
    }),
  });

  const UserType: GraphQLObjectType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
      profile: {
        type: ProfileType,
        resolve: async (source: User, _, context: Context): Promise<Profile | null> =>
          context.dataLoaders.profileLoader.load(source.id),
      },
      posts: {
        type: new GraphQLList(PostType),
        resolve: async (source: User, _, context: Context): Promise<Post[]> =>
          context.dataLoaders.postsLoader.load(source.id),
      },
      userSubscribedTo: {
        type: new GraphQLList(UserType),
        resolve: async (source: User, _, context: Context): Promise<User[]> =>
          context.dataLoaders.userSubscribedToLoader.load(source.id),
      },
      subscribedToUser: {
        type: new GraphQLList(UserType),
        resolve: async (source: User, _, context: Context): Promise<User[]> =>
          context.dataLoaders.subscribedToUserLoader.load(source.id),
      },
    }),
  });

  // Input типы
  const CreateUserInput = new GraphQLInputObjectType({
    name: 'CreateUserInput',
    fields: () => ({
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
    }),
  });

  const CreateProfileInput = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: () => ({
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      userId: { type: new GraphQLNonNull(UUIDType) },
      memberTypeId: { type: new GraphQLNonNull(MemberTypeIdEnum) },
    }),
  });

  const CreatePostInput = new GraphQLInputObjectType({
    name: 'CreatePostInput',
    fields: () => ({
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
      authorId: { type: new GraphQLNonNull(UUIDType) },
    }),
  });

  const ChangePostInput = new GraphQLInputObjectType({
    name: 'ChangePostInput',
    fields: () => ({
      title: { type: GraphQLString },
      content: { type: GraphQLString },
    }),
  });

  const ChangeProfileInput = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: () => ({
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLInt },
      memberTypeId: { type: MemberTypeIdEnum },
    }),
  });

  const ChangeUserInput = new GraphQLInputObjectType({
    name: 'ChangeUserInput',
    fields: () => ({
      name: { type: GraphQLString },
      balance: { type: GraphQLFloat },
    }),
  });

  // Mutation
  const MutationType = new GraphQLObjectType({
    name: 'Mutations',
    fields: () => ({
      createUser: {
        type: UserType,
        args: {
          dto: { type: new GraphQLNonNull(CreateUserInput) },
        },
        resolve: async (_, { dto }: { dto: CreateUserInputType }) =>
          prisma.user.create({ data: dto }),
      },

      changeUser: {
        type: UserType,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangeUserInput) },
        },
        resolve: async (_, { id, dto }: { id: string; dto: ChangeUserInputType }) =>
          prisma.user.update({
            where: { id },
            data: dto,
          }),
      },

      deleteUser: {
        type: GraphQLString,
        args: { id: { type: new GraphQLNonNull(UUIDType) } },
        resolve: async (_, { id }: { id: string }) => {
          await prisma.user.delete({ where: { id } });
          return 'deleted';
        },
      },

      createProfile: {
        type: ProfileType,
        args: {
          dto: { type: new GraphQLNonNull(CreateProfileInput) },
        },
        resolve: async (_, { dto }: { dto: CreateProfileInputType }) =>
          prisma.profile.create({ data: dto }),
      },

      changeProfile: {
        type: ProfileType,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangeProfileInput) },
        },
        resolve: async (_, { id, dto }: { id: string; dto: ChangeProfileInputType }) => {
          const data: Partial<Profile> & { memberTypeId?: string } = { ...dto };
          if (dto.memberTypeId) {
            data.memberTypeId = dto.memberTypeId.toLowerCase();
          }
          return prisma.profile.update({
            where: { id },
            data,
          });
        },
      },

      deleteProfile: {
        type: GraphQLString,
        args: { id: { type: new GraphQLNonNull(UUIDType) } },
        resolve: async (_, { id }: { id: string }) => {
          await prisma.profile.delete({ where: { id } });
          return 'deleted';
        },
      },

      createPost: {
        type: PostType,
        args: {
          dto: { type: new GraphQLNonNull(CreatePostInput) },
        },
        resolve: async (_, { dto }: { dto: CreatePostInputType }) =>
          prisma.post.create({ data: dto }),
      },

      changePost: {
        type: PostType,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangePostInput) },
        },
        resolve: async (_, { id, dto }: { id: string; dto: ChangePostInputType }) =>
          prisma.post.update({
            where: { id },
            data: dto,
          }),
      },

      deletePost: {
        type: GraphQLString,
        args: { id: { type: new GraphQLNonNull(UUIDType) } },
        resolve: async (_, { id }: { id: string }) => {
          await prisma.post.delete({ where: { id } });
          return 'deleted';
        },
      },

      subscribeTo: {
        type: GraphQLString,
        args: {
          userId: { type: new GraphQLNonNull(UUIDType) },
          authorId: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (
          _,
          { userId, authorId }: { userId: string; authorId: string },
        ) => {
          await prisma.subscribersOnAuthors.create({
            data: { subscriberId: userId, authorId },
          });
          return 'subscribed';
        },
      },

      unsubscribeFrom: {
        type: GraphQLString,
        args: {
          userId: { type: new GraphQLNonNull(UUIDType) },
          authorId: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (
          _,
          { userId, authorId }: { userId: string; authorId: string },
        ) => {
          await prisma.subscribersOnAuthors.delete({
            where: {
              subscriberId_authorId: { subscriberId: userId, authorId },
            },
          });
          return 'unsubscribed';
        },
      },
    }),
  });

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        users: {
          type: new GraphQLList(UserType),
          resolve: async (): Promise<User[]> => prisma.user.findMany(),
        },
        user: {
          type: UserType,
          args: {
            id: { type: new GraphQLNonNull(UUIDType) },
          },
          resolve: async (
            _,
            { id }: { id: string },
            context: Context,
          ): Promise<User | null> => context.dataLoaders.userLoader.load(id),
        },
        posts: {
          type: new GraphQLList(PostType),
          resolve: async (): Promise<Post[]> => prisma.post.findMany(),
        },
        post: {
          type: PostType,
          args: {
            id: { type: new GraphQLNonNull(UUIDType) },
          },
          resolve: async (_, { id }: { id: string }): Promise<Post | null> =>
            prisma.post.findUnique({ where: { id } }),
        },
        profiles: {
          type: new GraphQLList(ProfileType),
          resolve: async (): Promise<Profile[]> => prisma.profile.findMany(),
        },
        profile: {
          type: ProfileType,
          args: {
            id: { type: new GraphQLNonNull(UUIDType) },
          },
          resolve: async (_, { id }: { id: string }): Promise<Profile | null> =>
            prisma.profile.findUnique({ where: { id } }),
        },
        memberTypes: {
          type: new GraphQLList(MemberType),
          resolve: async (): Promise<PrismaMemberType[]> => prisma.memberType.findMany(),
        },
        memberType: {
          type: MemberType,
          args: {
            id: { type: new GraphQLNonNull(MemberTypeIdEnum) },
          },
          resolve: async (
            _,
            { id }: { id: string },
            context: Context,
          ): Promise<PrismaMemberType | null> =>
            context.dataLoaders.memberTypeLoader.load(id),
        },
      },
    }),
    mutation: MutationType,
  });
};
