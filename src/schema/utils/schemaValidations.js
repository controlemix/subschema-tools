const { ApolloError } = require('apollo-server-errors');

function customEntError(id, type, argName, key) {
  const _ERRORS = [
    { id: 'FIRST_ZERO', code: 'BAD_OPERATION_ARG', message: 'Error: first must be greater than 0' },
    { id: 'DATE_FORMAT', code: 'BAD_OPERATION_ARG', message: `Error: ${argName} must be in format yyyy-mm-dd` },
    { id: 'DATE_OLD', code: 'BAD_OPERATION_ARG', message: `Error: ${argName} must be greater than 1970` },
    { id: 'DATES_NULL', code: 'BAD_OPERATION_ARG', message: 'Error: loadDate or updateDate must be provided' },
    { id: 'TYPE_INVALID', code: 'BAD_ENTITIES_VARIABLES', message: `Error: Entities validation, Invalid Type: ${type}` },
    { id: 'FIELD_INVALID', code: 'BAD_ENTITIES_VARIABLES', message: `Error: Entities validation, Invalid Field: ${key}` },
  ];

  const _ERROR = _ERRORS.find((_error) => _error.id === id);
  const _ERR = {
    message: _ERROR.message,
    code: _ERROR.code,
    stack: '',
    exception: {
      stacktrace: [''],
    },
  };

  throw new ApolloError(_ERR.message, _ERR.code, _ERR);
}

function datesValidation(date, argName) {
  if (date !== undefined) {
    if (date?.length === 10) {
      let tempDate = new Date(date);
      if (tempDate.toString() === 'Invalid Date') {
        customEntError('DATE_FORMAT', '', argName, '');
      } else {
        if (tempDate.getFullYear() < 1970) {
          customEntError('DATE_OLD', '', argName, '');
        }
      }
    } else {
      if (date) {
        customEntError('DATE_FORMAT', '', argName, '');
      }
    }
  }
}

function argsConnectionValidation(argsType, _info) {
  if (argsType.first === 0 || argsType.first < 0) {
    customEntError('FIRST_ZERO', '', 'first', '');
  }
  if (!argsType.loadDate && !argsType.updateDate) {
    customEntError('DATES_NULL', '', '', '');
  } else {
    const loadDate = argsType.loadDate ? argsType.loadDate : undefined;
    const updateDate = argsType.updateDate ? argsType.updateDate : undefined;
    datesValidation(loadDate, 'loadDate');
    datesValidation(updateDate, 'updateDate');
  }
}

function argsEntitiesValidation(type, variables) {
  let fields = undefined;

  try {
    const { FieldsForType } = require(`../types/definitions/seeds/`)[type];
    fields = FieldsForType;
  } catch (error) {
    customEntError('TYPE_INVALID', type, '', '');
  }

  let fieldNames = '';

  Object.keys(fields).forEach((name) => {
    fieldNames += `${name} | `;
  });

  Object.keys(variables).forEach((key) => {
    if (key !== '__typename') {
      const found = fieldNames.includes(key);
      if (!found) {
        customEntError('FIELD_INVALID', type, '', key);
      }
    }
  });
}

module.exports = {
  argsConnectionValidation,
  argsEntitiesValidation,
};
