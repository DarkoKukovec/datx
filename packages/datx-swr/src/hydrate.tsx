import { PropsWithChildren } from 'react';
import { IJsonapiModel, Response } from '@datx/jsonapi';
import { SWRConfig } from 'swr';
import { useClient } from './hooks/useClient';
import { IClientInstance } from './interfaces/Client';
import { Fallback } from './interfaces/Fallback';
import { IGetAllResponse } from '@datx/jsonapi/dist/interfaces/IGetAllResponse';

const hydrate = (client: IClientInstance, fallback: Fallback | undefined) => {
  if (!fallback) {
    return {};
  }

  if (!client) {
    return {};
  }

  return Object.keys(fallback).reduce((previousValue, currentValue) => {
    const response = fallback[currentValue];

    if (Array.isArray(response)) {
      previousValue[currentValue] = response.reduce(
        (fallbackValue, rawResponse) => {
          const res = new Response(rawResponse, client);

          fallbackValue.responses.push(res);
          fallbackValue.data.push(...(res.data as Array<IJsonapiModel>));

          return fallbackValue;
        },
        { data: [], responses: [] } as Omit<IGetAllResponse<IJsonapiModel>, 'lastResponse'>,
      );
      previousValue[currentValue].lastResponse =
        previousValue[currentValue].responses[response.length - 1];
    } else {
      previousValue[currentValue] = new Response(response, client);
    }

    return previousValue;
  }, {});
};

export interface IHydrateProps {
  fallback: Fallback | undefined;
}

export function Hydrate({ children, fallback }: PropsWithChildren<IHydrateProps>) {
  const client = useClient();

  return <SWRConfig value={{ fallback: hydrate(client, fallback) }}>{children}</SWRConfig>;
}
