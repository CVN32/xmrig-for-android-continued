/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import base64 from 'react-native-base64';
import * as JSON5 from 'json5';
import {
  Configuration,
  ConfigurationMode,
  IAdvanceConfiguration,
  ISimpleConfiguration,
} from '../settings/settings.interface';
import { poolValidator } from '../utils/validators';
import { config as configJson } from './config';

type Pool = {
    user: string;
    pass: string;
    url: string;
    tls: boolean;
}
class ConfigBuilderPrivate {
  config: Record<string, any> = _.cloneDeep(configJson);

  reset() {
    this.config = _.cloneDeep(configJson);
  }

  setConfig(data: Record<string, any>) {
    this.config = _.cloneDeep(data);
  }

  setPool(pool: Partial<Pool>) {
    this.config = {
      ...this.config,
      pools: [
        {
          ...(this.config.pools?.[0] || {}),
          ...pool,
        },
      ],
    };
  }

  setProps(props: Record<string, any>) {
    this.config = _.merge(
      this.config,
      props,
    );
  }

  getConfigString() {
    return JSON.stringify(this.config);
  }

  getConfigBase64() {
    return base64.encode(this.getConfigString());
  }
}

export default class ConfigBuilder {
  public static build(configuration: Configuration): ConfigBuilderPrivate {
    if (!configuration) {
      throw new Error('Configuration is missing');
    }
    const pConfig = new ConfigBuilderPrivate();

    if (configuration.mode === ConfigurationMode.SIMPLE) {
      const asSimpleConfig: ISimpleConfiguration = _.cloneDeep(configuration);
      const pool = asSimpleConfig.properties?.pool;
      const validation = poolValidator.validate(pool || {});
      if (validation.error) {
        throw new Error(`Invalid pool configuration: ${validation.error.message}`);
      }

      pConfig.reset();
      pConfig.setPool({
        user: pool?.username?.trim(),
        pass: pool?.password || '',
        url: `${pool?.hostname?.trim()}:${Number(pool?.port)}`,
        tls: Boolean(pool?.sslEnabled),
      });
      pConfig.setProps({
        cpu: {
          priority: asSimpleConfig.properties?.cpu?.priority,
          yield: asSimpleConfig.properties?.cpu?.yield,
          'max-threads-hint': asSimpleConfig.properties?.cpu?.max_threads_hint,
        },
        randomx: {
          mode: asSimpleConfig.properties?.cpu?.random_x_mode,
        },
      });
      pConfig.setProps({
        cpu: {
          ...asSimpleConfig.properties?.algos,
        },
      });
      pConfig.setProps({
        'algo-perf': asSimpleConfig.properties?.algo_perf,
      });
      return pConfig;
    }

    if (configuration.mode === ConfigurationMode.ADVANCE) {
      const asAdvancedConfig: IAdvanceConfiguration = _.cloneDeep(configuration);
      const parsed = JSON5.parse(asAdvancedConfig.config || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Advanced configuration must be a JSON object');
      }
      pConfig.setConfig(parsed);
      pConfig.setProps({
        http: {
          enabled: true,
        },
        background: false,
        colors: true,
      });
      return pConfig;
    }

    throw new Error(`Unsupported configuration mode: ${(configuration as any).mode}`);
  }
}
