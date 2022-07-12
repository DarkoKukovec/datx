import { IRequestOptions } from '@datx/jsonapi';
import { JsonapiModelType, ModelTypes } from './Client';

export interface IGetOneExpression<TModel extends JsonapiModelType = JsonapiModelType> {
  readonly op: 'getOne';
  readonly type: TModel['type'];
  id: string;
  queryParams?: IRequestOptions['queryParams'];
}

export interface IGetManyExpression<TModel extends JsonapiModelType = JsonapiModelType> {
  readonly op: 'getMany';
  readonly type: TModel['type'];
  queryParams?: IRequestOptions['queryParams'];
}

export interface IGetAllExpression<TModel extends JsonapiModelType = JsonapiModelType> {
  readonly op: 'getAll';
  readonly type: TModel['type'];
  queryParams?: IRequestOptions['queryParams'];
  maxRequests?: number | undefined;
}

export type DeferredLike = null | undefined | false;

export type ExpressionArgument =
  | IGetOneExpression
  | IGetManyExpression
  | IGetAllExpression
  | DeferredLike;

export type Expression = ExpressionArgument | (() => ExpressionArgument);

export type RemoveDeferredLike<TType> = TType extends DeferredLike ? never : TType;

export type ExactExpressionArgument<TExpression> = TExpression extends () => infer RExpressionFn
  ? RExpressionFn extends () => infer RExpressionArgument
    ? RemoveDeferredLike<RExpressionArgument>
    : RemoveDeferredLike<RExpressionFn>
  : RemoveDeferredLike<TExpression>;

export type FindModel<TTypeLiteral extends string> = {
  [TModel in ModelTypes as TModel['type']]: TModel['type'] extends TTypeLiteral
    ? InstanceType<TModel>
    : never;
}[ModelTypes['type']];

export type FetcherExpressionArgument = RemoveDeferredLike<ExpressionArgument>;