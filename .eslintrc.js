module.exports = {
  extends: ['eslint:recommended', 'plugin:node/recommended', 'prettier'],
  rules: {
    'node/no-unsupported-features/es-syntax': 'off'
  },
  env: {
    node: true,
    es6: true
  }
};