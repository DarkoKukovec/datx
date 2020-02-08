import {
  getModelId,
  getModelType,
  ICollectionConstructor,
  IModelConstructor,
  initModelRef,
  IReferenceOptions,
  IType,
  PureCollection,
  PureModel,
  ReferenceType,
  updateModel,
} from 'datx';
import { getMeta, IRawModel, mapItems, deprecated } from 'datx-utils';
import { action, isArrayLike } from 'mobx';

import { clearAllCache, clearCacheByType } from './cache';
import { GenericModel } from './GenericModel';
import { flattenModel, removeModel } from './helpers/model';
import { buildUrl, prepareQuery } from './helpers/url';
import { getModelClassRefs, isBrowser } from './helpers/utils';
import { IHeaders } from './interfaces/IHeaders';
import { IJsonapiCollection } from './interfaces/IJsonapiCollection';
import { IJsonapiModel } from './interfaces/IJsonapiModel';
import { IRequestOptions } from './interfaces/IRequestOptions';
import { IDefinition, IRecord, IRelationship, IRequest, IResponse } from './interfaces/JsonApi';
import { libFetch, read } from './NetworkUtils';
import { Response } from './Response';
import { CachingStrategy } from './enums/CachingStrategy';

function handleErrors<T extends IJsonapiModel>(response: Response<T>) {
  if (response.error) {
    throw response.error;
  }

  return response;
}

function iterateEntries<T extends IJsonapiModel>(
  body: IResponse,
  fn: (item: IRecord) => T,
): T | Array<T>;

function iterateEntries<T extends IJsonapiModel>(
  body: IResponse,
  fn: (item: IRecord) => void,
): void;

function iterateEntries<T extends IJsonapiModel>(body: IResponse, fn: (item: IRecord) => T) {
  mapItems((body && body.included) || [], fn);

  return mapItems((body && body.data) || [], fn);
}

export function decorateCollection(BaseClass: typeof PureCollection) {
  class JsonapiCollection extends BaseClass {
    public static types =
      BaseClass.types && BaseClass.types.length
        ? BaseClass.types.concat(GenericModel)
        : [GenericModel];

    public static maxCacheAge: number = BaseClass['maxCacheAge'];

    // eslint-disable-next-line no-nested-ternary
    public static cache?: CachingStrategy = BaseClass['cache'];

    public static defaultModel = BaseClass['defaultModel'] || GenericModel;

    @action public sync<T extends IJsonapiModel = IJsonapiModel>(
      body?: IResponse,
    ): T | Array<T> | null {
      if (!body) {
        return null;
      }
      const data: T | Array<T> | null = iterateEntries(body, (obj: IRecord) =>
        this.__addRecord<T>(obj),
      );

      iterateEntries(body, this.__updateRelationships.bind(this));

      return data;
    }

    /**
     * Fetch the records with the given type and id
     *
     * @param {string} type Record type
     * @param {string} type Record id
     * @param {IRequestOptions} [options] Server options
     * @returns {Promise<Response>} Resolves with the Response object or rejects with an error
     */
    public fetch<T extends IJsonapiModel = IJsonapiModel>(
      type: IType | IModelConstructor<T>,
      id: string,
      options?: IRequestOptions,
    ): Promise<Response<T>> {
      deprecated('fetch is deprecated, use getOne instead');
      return this.getOne(type, id, {
        ...options,
        cacheOptions: {
          ...options?.cacheOptions,
          cachingStrategy: isBrowser ? CachingStrategy.CACHE_FIRST : CachingStrategy.NETWORK_ONLY,
        },
      });
    }

    /**
     * Fetch the first page of records of the given type
     *
     * @param {string} type Record type
     * @param {IRequestOptions} [options] Server options
     * @returns {Promise<Response>} Resolves with the Response object or rejects with an error
     */
    public fetchAll<T extends IJsonapiModel = IJsonapiModel>(
      type: IType | IModelConstructor<T>,
      options?: IRequestOptions,
    ): Promise<Response<T>> {
      deprecated('fetchAll is deprecated, use getMany instead');
      return this.getMany(type, {
        ...options,
        cacheOptions: {
          ...options?.cacheOptions,
          cachingStrategy: isBrowser ? CachingStrategy.CACHE_FIRST : CachingStrategy.NETWORK_ONLY,
        },
      });
    }

    public getOne<T extends IJsonapiModel = IJsonapiModel>(
      type: IType | IModelConstructor<T>,
      id: string,
      options?: IRequestOptions,
    ): Promise<Response<T>> {
      const modelType = getModelType(type);
      const query = this.__prepareQuery(modelType, id, undefined, options);
      const reqOptions = options || {};

      reqOptions.networkConfig = reqOptions.networkConfig || {};
      reqOptions.networkConfig.headers = query.headers;

      return read<T>(query.url, this, reqOptions).then(handleErrors);
    }

    public getMany<T extends IJsonapiModel = IJsonapiModel>(
      type: IType | IModelConstructor<T>,
      options?: IRequestOptions,
    ): Promise<Response<T>> {
      const modelType = getModelType(type);
      const query = this.__prepareQuery(modelType, undefined, undefined, options);
      const reqOptions = options || {};

      reqOptions.networkConfig = reqOptions.networkConfig || {};
      reqOptions.networkConfig.headers = query.headers;

      return read<T>(query.url, this, reqOptions).then(handleErrors);
    }

    public request<T extends IJsonapiModel = IJsonapiModel>(
      url: string,
      method: string = 'GET',
      data?: object,
      options?: IRequestOptions,
    ): Promise<Response<T>> {
      const query = buildUrl(url, data, options);

      return libFetch<T>({ url: query.url, options, data, method, collection: this });
    }

    public removeOneRemote(
      type: IType | typeof PureModel,
      id: string,
      options?: IRequestOptions,
    ): Promise<void>;

    public removeOneRemote(model: PureModel, options?: IRequestOptions): Promise<void>;

    @action public removeOneRemote(
      obj: IType | typeof PureModel | PureModel,
      id?: string | boolean | IRequestOptions,
      options?: boolean | IRequestOptions,
    ) {
      let remoteOp: boolean | IRequestOptions | undefined;
      let modelId: string;
      let model: IJsonapiModel | null;
      const type = getModelType(obj);

      if (typeof id === 'object' || id === undefined) {
        remoteOp = id;
        modelId = getModelId(obj).toString();
        model = obj as IJsonapiModel;
      } else {
        remoteOp = options;
        modelId = getModelId(id).toString();
        model = modelId ? (this.findOne(type, modelId) as IJsonapiModel | null) : null;
      }

      if (model) {
        return removeModel(model, typeof remoteOp === 'object' ? remoteOp : undefined);
      }

      if (model) {
        super.removeOne(model);
      }
      clearCacheByType(type);

      return Promise.resolve();
    }

    @action public removeAll(type: string | number | typeof PureModel) {
      super.removeAll(type);
      clearCacheByType(getModelType(type));
    }

    @action public reset() {
      super.reset();
      clearAllCache();
    }

    private __addRecord<T extends IJsonapiModel = IJsonapiModel>(obj: IRecord): T {
      const staticCollection = this.constructor as typeof PureCollection;
      const { type, id } = obj;
      let record: T | null = id === undefined ? null : (this.findOne(type, id) as T | null);
      const Type =
        staticCollection.types.find((item) => getModelType(item) === type) || GenericModel;
      const classRefs = getModelClassRefs(Type);
      const flattened: IRawModel = flattenModel(classRefs, obj);

      if (record) {
        updateModel(record, flattened);
      } else if (staticCollection.types.filter((item) => item.type === type).length) {
        record = this.add<T>(flattened, type);
      } else {
        record = this.add(new GenericModel(flattened, this)) as T;
      }

      return record;
    }

    private __updateRelationships(obj: IRecord): void {
      const record: PureModel | null = obj.id === undefined ? null : this.findOne(obj.type, obj.id);
      const refs: Array<string> = obj.relationships ? Object.keys(obj.relationships) : [];

      refs.forEach((ref: string) => {
        const refData = (obj.relationships as Record<string, IRelationship>)[ref];

        if (!refData || !('data' in refData)) {
          return;
        }
        const items = refData.data;

        if (isArrayLike(items) && items.length < 1) {
          // it's only possible to update items with one ore more refs. Early exit
          return;
        }

        if (record) {
          if (items) {
            const models: PureModel | Array<PureModel> | string | null =
              mapItems(
                items,
                (def: IDefinition) =>
                  (def.id === undefined ? null : this.findOne(def.type, def.id)) || def,
              ) || null;

            const itemType: string = isArrayLike(items) ? items[0].type : items.type;

            if (ref in record) {
              record[ref] = models;
            } else {
              initModelRef(
                record,
                ref,
                { model: itemType, type: ReferenceType.TO_ONE_OR_MANY },
                models,
              );
            }
          } else {
            const refsDef = getMeta(record, 'refs') as Record<string, IReferenceOptions>;

            if (refsDef && ref in refsDef) {
              record[ref] = refsDef[ref].type === ReferenceType.TO_MANY ? [] : null;
            }
          }
        }
      });
    }

    private __prepareQuery(
      type: IType,
      id?: number | string,
      data?: IRequest,
      options?: IRequestOptions,
    ): {
      url: string;
      data?: object;
      headers: IHeaders;
    } {
      return prepareQuery(type, id, data, options, this);
    }
  }

  return JsonapiCollection as ICollectionConstructor<PureCollection & IJsonapiCollection>;
}
