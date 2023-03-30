import { IType, Model, prop } from '@datx/core';
import { mobx } from '@datx/utils';

import { jsonapiModel } from '../../../src';
import { Event } from './Event';

export class Image extends jsonapiModel(Model) {
  public static type: IType = 'image';

  @prop
  public name!: string;

  @prop.toOne('event')
  public event!: Event;

  @mobx.computed
  get id(): string {
    return this.meta.id.toString();
  }
}
