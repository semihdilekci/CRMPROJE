/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/lib/**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  // expo-device ve react-native native modülleri jest'te mock'lanır
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
};
