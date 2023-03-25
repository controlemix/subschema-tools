const upperCaseFirstLetter = (str) => {
    let firstLetter = str.substr(0, 1);
    return firstLetter.toUpperCase() + str.substr(1);
  }
const lowerCaseFirstLetter = (str) => {
    let firstLetter = str.substr(0, 1);
    return firstLetter.toLowerCase() + str.substr(1);
  }

const queryFn = (q) => q;
const paramFn = (p) => p;
const errorFn = (e) => new Error(e);
const errorApolloFn = (e) =>   e
const errorTry = (message) => new Error(message);

module.exports = {
  upperCaseFirstLetter,
  lowerCaseFirstLetter,
  queryFn,
  paramFn,
  errorFn,
  errorApolloFn,
  errorTry
};
