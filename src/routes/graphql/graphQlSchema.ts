import { GraphQLString, GraphQLObjectType, GraphQLSchema } from 'graphql';

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
      testString: {
        type: GraphQLString,
        resolve: async () => {
          return 'Hello World';
        },
      },
    },
  }),
});
