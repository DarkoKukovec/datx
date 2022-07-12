import { IRequestOptions } from '@datx/jsonapi';
import { Middleware, SWRHook } from 'swr';

export const middleware: Middleware = (useSWRNext: SWRHook) => (key, fetcher, config) => {
  const { networkConfig, ...swrConfig } =
    (config as typeof config & { networkConfig: IRequestOptions['networkConfig'] }) || {};

  return useSWRNext(
    key,
    fetcher && ((expression) => fetcher(expression, { networkConfig })),
    swrConfig,
  );
};