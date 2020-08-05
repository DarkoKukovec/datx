import { IConfigType } from './interfaces/IConfigType';
import { IHeaders } from './interfaces/IHeaders';
import { CachingStrategy } from './enums/CachingStrategy';
import { isBrowser } from './helpers/utils';
import { ParamArrayType } from './enums/ParamArrayType';
import { NetworkPipeline } from './NetworkPipeline';
import { IResponseHeaders } from './interfaces/IResponseHeaders';
import { PureModel } from 'datx';
import { IResponseObject } from './interfaces/IResponseObject';
import { BodyType } from './enums/BodyType';

/**
 * Base implementation of the fetch function (can be overridden)
 *
 * @param {IConfigType} config The request config
 * @param {string} method API call method
 * @param {string} url API call URL
 * @param {object} [body] API call body
 * @param {IHeaders} [requestHeaders] Headers that will be sent
 * @returns {Promise<IResponseObject>} Resolves with a raw response object
 */
export function baseFetch<TModel extends PureModel, TParams extends object>(
  requestObj: NetworkPipeline<TModel, TParams>,
  method: string,
  url: string,
  body?: string | FormData,
  requestHeaders: IHeaders = {},
): Promise<IResponseObject> {
  let data: object;
  let status: number;
  let headers: IResponseHeaders;

  const request: Promise<void> = Promise.resolve();

  const uppercaseMethod = method.toUpperCase();
  const isBodySupported = uppercaseMethod !== 'GET' && uppercaseMethod !== 'HEAD';

  return request
    .then(() => {
      const defaultHeaders = requestObj.config.defaultFetchOptions.headers || {};
      const reqHeaders: IHeaders = Object.assign({}, defaultHeaders, requestHeaders) as IHeaders;
      const options = Object.assign({}, requestObj.config.defaultFetchOptions, {
        body: (isBodySupported && body) || undefined,
        headers: reqHeaders,
        method,
      });

      if (requestObj.config.fetchReference) {
        return requestObj.config.fetchReference(url, options);
      }
      throw new Error('Fetch reference needs to be defined before using the network');
    })
    .then((response: Response) => {
      status = response.status;
      headers = response.headers;

      return response.json();
    })
    .catch((error: Error) => {
      if (status === 204) {
        return null;
      }
      throw error;
    })
    .then((responseData: object) => {
      data = responseData;
      if (status >= 400) {
        throw {
          message: `Invalid HTTP status: ${status}`,
          status,
        };
      }

      return { data, headers, requestHeaders, status };
    })
    .catch((error) => {
      throw { data, error, headers, requestHeaders, status };
    });
}

export function getDefaultConfig(): IConfigType {
  return {
    // Base URL for all API calls
    baseUrl: '/',

    // Enable caching by default in the browser
    cache: isBrowser ? CachingStrategy.CACHE_FIRST : CachingStrategy.NETWORK_ONLY,
    maxCacheAge: Infinity,

    // Default options that will be passed to the fetch function
    defaultFetchOptions: {
      headers: {
        'content-type': 'application/vnd.api+json',
      },
    },

    encodeQueryString: true,

    // Reference of the fetch method that should be used
    fetchReference:
      (isBrowser &&
        'fetch' in window &&
        typeof window.fetch === 'function' &&
        window.fetch.bind(window)) ||
      undefined,

    // Determines how will the request param arrays be stringified
    paramArrayType: ParamArrayType.PARAM_ARRAY,

    serialize(data: object, _type: BodyType): object {
      return data;
    },

    parse(data: object): object {
      return data;
    },
  };
}
