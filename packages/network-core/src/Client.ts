import { PureModel, Collection, getModelId } from '@datx/core';
import { Request } from './Request';
import { QueryBuilder } from './QueryBuilder';
import { INetwork } from './interfaces/INetwork';
import { IClientOptions } from './interfaces/IClientOptions';

export class Client<TNetwork extends INetwork, TRequestClass extends typeof Request> {
  private QueryBuilderConstructor: typeof QueryBuilder;
  private network: TNetwork;
  private collection?: Collection;
  private request: TRequestClass;
  private options: IClientOptions;

  constructor({
    QueryBuilder: QueryBuilderConstructor,
    network,
    collection,
    request,
    options = {},
  }: {
    QueryBuilder: typeof QueryBuilder;
    network: TNetwork;
    collection?: Collection;
    request: TRequestClass;
    options?: IClientOptions;
  }) {
    this.QueryBuilderConstructor = QueryBuilderConstructor;
    this.network = network;
    this.collection = collection;
    this.request = request;
    this.options = options;
  }

  from<
    TModelClass extends typeof PureModel,
    TModelInstance extends
      | (InstanceType<TModelClass> & PureModel)
      | unknown = InstanceType<TModelClass>,
  >(type: TModelClass): QueryBuilder<Array<TModelInstance>, TRequestClass, TNetwork, TModelClass> {
    return new this.QueryBuilderConstructor({
      match: [],
      headers: {},
      request: this.request,
      options: this.options,
      refs: {
        client: this,
        network: this.network,
        collection: this.collection,
        modelConstructor: type,
      },
      metadata: {},
    });
  }

  fromInstance<
    TModelClass extends typeof PureModel,
    TModelInstance extends
      | (InstanceType<TModelClass> & PureModel)
      | unknown = InstanceType<TModelClass>,
  >(model: TModelInstance): QueryBuilder<TModelInstance, TRequestClass, TNetwork, TModelClass>;
  fromInstance<
    TModelClass extends typeof PureModel,
    TModelInstance extends
      | (InstanceType<TModelClass> & PureModel)
      | unknown = InstanceType<TModelClass>,
  >(
    type: TModelClass,
    id: string,
  ): QueryBuilder<TModelInstance, TRequestClass, TNetwork, TModelClass>;
  fromInstance<
    TModelClass extends typeof PureModel,
    TModelInstance extends
      | (InstanceType<TModelClass> & PureModel)
      | unknown = InstanceType<TModelClass>,
  >(
    model: TModelInstance | TModelClass,
    id?: string,
  ): QueryBuilder<TModelInstance, TRequestClass, TNetwork, TModelClass> {
    const modelConstructor: TModelClass = (
      model instanceof PureModel ? model.constructor : model
    ) as TModelClass;

    let modelId: string;
    if (!id && id !== '') {
      if (!(model instanceof PureModel)) {
        throw new Error('You need to provide an id to use fromInstance');
      }
      modelId = String(getModelId(model));
    } else {
      modelId = id;
    }
    return this.from<TModelClass, TModelInstance>(modelConstructor).id(modelId) as QueryBuilder<
      TModelInstance,
      TRequestClass,
      TNetwork,
      TModelClass
    >;
  }
}
