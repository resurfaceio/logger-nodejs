module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    mocha: true
  },
  extends: [
    'airbnb-base', 'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  ignorePatterns: ["*_spec.js"],
  rules: {
          
      "no-underscore-dangle": 'off',
      "global-require": 0 ,
      'camelcase': 'off', 
  
  },
};
