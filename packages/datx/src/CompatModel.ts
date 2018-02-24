import {IDictionary, IRawModel, mapItems} from 'datx-utils';
import {isObservableArray} from 'mobx';

import {Collection} from './Collection';
import {FieldType} from './enums/FieldType';
import {ReferenceType} from './enums/ReferenceType';
import {updateField} from './helpers/model/fields';
import {initModelField, initModelRef} from './helpers/model/init';
import {
  getModelCollection,
  getModelId,
  getModelMetaKey,
  getModelType,
  modelToJSON,
  updateModel,
} from './helpers/model/utils';
import {IReferences} from './interfaces/IReferences';
import {IType} from './interfaces/IType';
import {PureModel} from './PureModel';
import {storage} from './services/storage';

export class CompatModel extends PureModel {
  public static refs: IReferences = {};
  public static defaults: IDictionary<any> = {};

  constructor(initialData: object, collection?: Collection) {
    super(initialData, collection);

    Object.keys(this.static.refs).forEach((prop) => {
      const refs = getModelMetaKey(this, 'refs');
      if (prop in refs) {
        return;
      }
      const ref = this.static.refs[prop];
      const data = mapItems(this[prop] || this.static.defaults[prop], getModelId);
      if (typeof ref === 'object') {
        // Back reference
        initModelRef(this, prop, {
          model: ref.model,
          property: ref.property,
          type: ReferenceType.TO_ONE_OR_MANY,
        }, data);
      } else {
        // Normal reference
        initModelRef(this, prop, {
          model: ref,
          type: ReferenceType.TO_ONE_OR_MANY,
        }, data);
      }
    });

    Object.keys(this.static.defaults).forEach((prop) => {
      if (!(prop in this.static.refs) && !(prop in this)) {
        initModelField(this, prop, this.static.defaults[prop]);
      }
    });
  }

  public getRecordId() {
    return getModelId(this);
  }

  public getRecordType() {
    return getModelType(this);
  }

  public assign(key: string, value: any) {
    let type = FieldType.DATA;
    const modelId = storage.getModelClassMetaKey(this.static, 'id');
    const modelType = storage.getModelClassMetaKey(this.static, 'type');
    if (key === modelId) {
      type = FieldType.ID;
    } else if (key === modelType) {
      type = FieldType.TYPE;
    }

    updateField(this, key, value, type);
    return value;
  }

  public assignRef(key: string, value: any, type?: IType) {
    const refs = getModelMetaKey(this, 'refs');

    if (refs[key]) {
      return this[key] = value;
    }

    let model = type;
    if (!model) {
      if (value instanceof Array || isObservableArray(value)) {
        model = value.reduce((t, m) => t || getModelType(m), null);
      } else if (value instanceof PureModel) {
        model = getModelType(value);
      }
    }

    if (!model) {
      throw new Error('The type property is missing');
    }

    initModelRef(this, key, {
      model,
      type: ReferenceType.TO_ONE_OR_MANY,
    }, value);
    return this[key];
  }

  public update(data: PureModel | IDictionary<any>): object {
    const updateData = Object.assign({}, data);
    Object.keys(updateData).forEach((key) => {
      if (typeof this[key] === 'function') {
        delete updateData[key];
      }
    });
    return updateModel(this, updateData);
  }

  public get static() {
    return this.constructor as typeof CompatModel;
  }

  public toJS() {
    return modelToJSON(this);
  }

  public get snapshot() {
    return modelToJSON(this);
  }

  private get __collection() {
    return getModelCollection(this);
  }
}
