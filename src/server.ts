import express from "express";
import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { BookResolver } from "./resolvers/book.resolver";
import { buildSchema } from "type-graphql"; // tranforma el lenguaje js o typescript en graphql
import { AuthorResolver } from "./resolvers/author.resolver";
import { AuthResolver } from "./resolvers/auth.resolver";

export async function startServer() {
  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [BookResolver, AuthorResolver, AuthResolver], // hay que pasarle los resolvers
    }),
    context: ({ req, res }) => ({ req, res }),
  }); // hay que pasarle los resolves a apollo
  apolloServer.applyMiddleware({ app, path: "/graphql" }); // se le pasa el server qe seria app, y la ruta

  return app;
}
