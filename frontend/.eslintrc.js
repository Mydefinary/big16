module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    'airbnb', // airbnb 스타일 가이드 (선택사항)
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true, // React JSX 문법 사용 허용
    },
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'indent': ['error', 2],
    'semi': ['error', 'always'], // React 프로젝트는 세미콜론 붙이는 걸 권장
    'react/react-in-jsx-scope': 'off', // React 17 이상부터는 import React 불필요
    // 필요에 따라 추가 커스텀 룰 작성
  },
  settings: {
    react: {
      version: 'detect', // 설치된 React 버전을 자동으로 감지
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  ignorePatterns: ['node_modules', 'dist', '*.d.ts'],
}
