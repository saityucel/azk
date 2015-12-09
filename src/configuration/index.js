import { _, isBlank } from 'azk';
import { meta as azkMeta } from 'azk';
import { ConfigurationInvalidValueRegexError, ConfigurationInvalidKeyError } from 'azk/utils/errors';
import { Helpers } from 'azk/cli/helpers';
import { promiseResolve } from 'azk/utils/promises';

const NULL_REGEX = /^(null|undefined|none|blank|reset)$/i;

module.exports = class Configuration {
  constructor(opts) {
    this.opts = _.merge({}, {}, opts);

    const BOOLEAN_REGEX = /^(on|true|1|off|false|0|null|undefined|none|blank|reset)$/i;

    const BOOLEAN_CONVERSION_FUNC = (str_arg) => {
      if (typeof str_arg === 'undefined' || str_arg === null) {
        // was not informed
        return undefined;
      }

      str_arg = str_arg.toLowerCase(str_arg);

      // ex: "on"    -> true
      // ex: "1"     -> true
      // ex: "false" -> false
      // ex: "none"  -> null
      if (str_arg === 'on' ||
          str_arg === 'true' ||
          str_arg === '1') {
        return true;
      }

      if (str_arg === 'off' ||
          str_arg === 'false' ||
          str_arg === '0') {
        return false;
      }

      if (str_arg === 'null' ||
          str_arg === 'undefined' ||
          str_arg === 'none' ||
          str_arg === 'blank' ||
          str_arg === 'reset') {
        return null;
      }
    };

    // user can inform a null value to a string configuration
    const STRING_CONVERSION_FUNC = (str_arg) => {
      if (typeof str_arg === 'undefined' || str_arg === null) {
        // was not
        return undefined;
      }

      if (str_arg.toLowerCase() === 'null' ||
          str_arg.toLowerCase() === 'undefined' ||
          str_arg.toLowerCase() === 'none' ||
          str_arg.toLowerCase() === 'blank' ||
          str_arg.toLowerCase() === 'reset') {
        return null;
      }
      return str_arg;
    };

    // initial configuration
    this.opts._azk_config_list = [
      {
        key: 'user.email',
        type: 'string',
        validation_regex: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,
        convertValidValueFunction: STRING_CONVERSION_FUNC,
        verbose_level: 0,
        ask_promise: Helpers._askEmailIfNeeded.bind(Helpers),
      },
      {
        key: 'user.email.always_ask',
        type: 'boolean',
        validation_regex: BOOLEAN_REGEX,
        convertValidValueFunction: BOOLEAN_CONVERSION_FUNC,
        verbose_level: 0,
        ask_promise: Helpers.askEmailEverytime.bind(Helpers),
      },
      {
        key: 'user.email.ask_count',
        type: 'number',
        verbose_level: 1,
      },
      {
        key: 'terms_of_use.accepted',
        type: 'boolean',
        validation_regex: BOOLEAN_REGEX,
        convertValidValueFunction: BOOLEAN_CONVERSION_FUNC,
        verbose_level: 0,
        ask_promise: Helpers.askTermsOfUse.bind(Helpers),
      },
      {
        key: 'terms_of_use.ask_count',
        type: 'number',
        verbose_level: 1,
      },
      {
        key: 'crash_reports.always_send',
        type: 'boolean',
        validation_regex: BOOLEAN_REGEX,
        convertValidValueFunction: BOOLEAN_CONVERSION_FUNC,
        verbose_level: 0,
      },
      {
        key: 'tracker_permission',
        type: 'boolean',
        validation_regex: BOOLEAN_REGEX,
        convertValidValueFunction: BOOLEAN_CONVERSION_FUNC,
        verbose_level: 0,
      },
    ];
  }

  save(key, value) {
    azkMeta.set(key, value);
  }

  load(key) {
    return azkMeta.get(key);
  }

  remove(key) {
    return azkMeta.del(key);
  }

  validate(key, value) {
    // key exists?
    let current_config = this.opts._azk_config_list.filter((item) => {
      return item.key === key;
    });
    if (current_config.length === 0) {
      throw new ConfigurationInvalidKeyError(key, value);
    }

    // inserting null/undefined/... value is valid
    let is_valid_null = NULL_REGEX.test(value);
    if (is_valid_null) {
      return true;
    }

    // valid regex value?
    let validation_regex = current_config.length > 0 && current_config[0].validation_regex;
    let value_exist = !isBlank(value);

    if (validation_regex && value_exist && !is_valid_null) {
      let is_value_valid = current_config[0].validation_regex.test(value);
      if (!is_value_valid) {
        throw new ConfigurationInvalidValueRegexError(key, value);
      }
    }

    return true;
  }

  convertInputValue(key, value) {
    // get key
    let current_config = this.opts._azk_config_list.filter((item) => {
      return item.key === key;
    });

    // convert
    let convertValidValueFunction = current_config.length > 0 && current_config[0].convertValidValueFunction;
    if (convertValidValueFunction) {
      return convertValidValueFunction(value);
    } else {
      return value;
    }
  }

  ask(ui, cmd, key) {
    // get key
    let current_config = this.opts._azk_config_list.filter((item) => {
      return item.key === key;
    });

    // convert
    let ask_promise = current_config.length > 0 && current_config[0].ask_promise;
    if (ask_promise) {
      return ask_promise(ui, cmd, true).then(() => promiseResolve(0));
    } else {
      return promiseResolve(0);
    }
  }

  listAll() {
    let listWithValues = _.map(this.opts._azk_config_list, (item) => {
      item.value = azkMeta.get(item.key);
      return item;
    });
    return listWithValues;
  }

  getAll() {
    return this.opts._azk_config_list;
  }

  resetAll() {
    this.opts._azk_config_list.forEach((item) => {
      azkMeta.set(item.key, undefined);
    });
    return true;
  }

  show(item_name) {
    return { [item_name]: this.listAll()[item_name] };
  }

};
