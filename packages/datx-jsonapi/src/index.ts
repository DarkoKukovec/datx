export { jsonapi } from './mixin';
export { Response } from './Response';
export { NetworkResponse } from './NetworkResponse';
export { GenericModel } from './GenericModel';

export {
  fetchModelLink,
  fetchModelRefLink,
  getModelLinks,
  getModelMeta,
  getModelRefLinks,
  getModelRefMeta,
  getModelEndpointUrl,
  modelToJsonApi,
  saveRelationship,
  isModelPersisted,
  saveModel,
} from './helpers/model';

export { BaseJsonapiRequest } from './BaseRequest';
// export { setBaseRequest, getBaseRequest, pipeBaseRequest } from './BaseRequest';

export { ICollectionFetchOpts } from './interfaces/ICollectionFetchOpts';
export { IJsonapiCollection } from './interfaces/IJsonapiCollection';
export { IJsonapiModel } from './interfaces/IJsonapiModel';
export { IJsonapiView } from './interfaces/IJsonapiView';
export { IRawResponse } from './interfaces/IRawResponse';
export { IRequestOptions } from './interfaces/IRequestOptions';

export { config } from './NetworkUtils';

export {
  BaseRequest,
  addInterceptor,
  cache,
  method,
  setUrl,
  body,
  query,
  header,
  params,
  fetchReference,
  encodeQueryString,
  paramArrayType,
  serializer,
  parser,
  collection,
  ParamArrayType,
  CachingStrategy,
  HttpMethod,
  IFetchOptions,
  IHeaders,
  IInterceptor,
  INetworkHandler,
  IPipeOperator,
  IResponseObject,
  clearAllCache,
  clearCacheByType,
} from 'datx-network';
