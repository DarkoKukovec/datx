import { Headers, IResponseHeaders } from '@datx/utils';
import { BaseRequest } from './BaseRequest';
import { IFetchOptions } from './interfaces/IFetchOptions';
import { IResponseObject } from './interfaces/IResponseObject';
import { Network } from './Network';

export class PromiseNetwork extends Network<Promise<any>> {
  public readonly baseRequest!: BaseRequest<Promise<any>>;

  public exec<T, U = unknown>(
    asyncVal: Promise<U>,
    successFn?: (value: U) => T,
    failureFn?: (error: Error) => T,
  ): Promise<T> {
    return asyncVal.then(successFn, failureFn);
  }

  public baseFetch(request: IFetchOptions): Promise<IResponseObject> {
    let status = 0;
    let headers: IResponseHeaders = new Headers([]);
    return this.fetchReference(request.url)
      .then((res) => {
        status = res.status || status;
        headers = res.headers || headers;
        if (!res.status) {
          throw new Error('Network error');
        }
        const contentType = headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        return res.text();
      })
      .then((data) => ({ status, headers, data }))
      .catch((error) => ({ status, headers, error }));
  }
}