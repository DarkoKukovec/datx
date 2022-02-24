import { Hydrate } from '@datx/swr';
import type { NextPage, InferGetServerSidePropsType } from 'next';

import { queryPosts } from '../../../components/features/posts/Posts.queries';
import { Todos } from '../../../components/features/todos/Todos';
import { queryTodos } from '../../../components/features/todos/Todos.queries';
import { Layout } from '../../../components/shared/layouts/Layout/Layout';
import { createClient } from '../../../datx/createClient';

type SSRProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const SSR: NextPage<SSRProps> = ({ fallback }) => {
  console.log(JSON.parse(fallback));
  return (
    <Hydrate fallback={JSON.parse(fallback)}>
      <Layout>
        <Todos />
      </Layout>
    </Hydrate>
  );
};

export const getServerSideProps = async () => {
  const client = createClient();
  console.log(JSON.stringify(client, undefined, 2));

  await client.fetchQuery(queryTodos);
  await client.fetchQuery(queryPosts);

  // TODO - handle 404

  console.log(client.fallback, JSON.stringify(client.fallback));
  return {
    props: {
      fallback: JSON.stringify(client.fallback),
    },
  };
};

export default SSR;
