module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base', 'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
          
      "no-underscore-dangle": 'off',
      "global-require": 0  
  
  },
};
