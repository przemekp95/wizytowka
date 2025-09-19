'use client';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const uri = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

export function makeApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri, fetch }),
    cache: new InMemoryCache(),
    connectToDevTools: process.env.NODE_ENV !== 'production',
  });
}
