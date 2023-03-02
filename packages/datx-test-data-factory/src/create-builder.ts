import { Fields, IBuildConfiguration, IBuilderConfig, ModelType } from './types';
import { getModelType, PureCollection } from '@datx/core';
import { compute, computeField } from './compute';
import { getTraitOverrides, getTraits } from './traits';

export const createBuilder = <TCollection extends PureCollection, TModelType extends ModelType>({
  client,
  model,
  config,
  context,
}: IBuilderConfig<TCollection, TModelType>) => {
  const { fields } = config || {};

  const builder = (buildTimeConfig?: IBuildConfiguration<TModelType>): InstanceType<TModelType> => {
    const traits = getTraits(buildTimeConfig);
    const traitOverrides = getTraitOverrides(traits, config);

    const computedFields = fields ? compute(fields, buildTimeConfig, traitOverrides, context) : {};

    // A user might define a value in a trait that doesn't exist in the base
    // set of fields. So we need to check now if the traits set any values that
    // aren't in the base, and set them too.
    traits.forEach((trait) => {
      const traitConfig = config?.traits?.[trait] || {};

      if (!traitConfig.overrides) {
        return;
      }

      for (const stringKey of Object.keys(traitConfig.overrides)) {
        const key = stringKey as keyof Fields<TModelType>;

        // If the key already exists in the base fields, we'll have defined it,
        // so we don't need to worry about it.
        // @ts-ignore
        // eslint-disable-next-line no-unsafe-optional-chaining
        if (key in config?.fields === false) {
          // @ts-ignore
          computedFields[key] = computeField(traitConfig.overrides[key], key, context);
        }
      }
    });

    const type = getModelType(model);

    const data = client.add(computedFields, type) as InstanceType<TModelType>;

    const traitPostBuilds = traits.map((trait) => {
      const traitConfig = config?.traits?.[trait] || {};
      const postBuild = traitConfig.postBuild || ((fields) => fields);

      return postBuild;
    });

    const afterTraitPostBuildFields = traitPostBuilds.reduce((fields, traitPostBuild) => {
      return traitPostBuild(fields);
    }, data);

    if (config?.postBuild) {
      return config.postBuild(afterTraitPostBuildFields);
    }

    return data;
  };

  builder.reset = () => {
    context.reset();
  };

  return builder;
};
