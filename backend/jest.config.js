/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', moduleResolution: 'node' } },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
};
