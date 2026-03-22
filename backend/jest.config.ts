import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }]
  },
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/modules/medicine-safety/**/*.ts', 'src/clients/rxnav.client.ts'],
  moduleFileExtensions: ['ts', 'js', 'json']
};

export default config;
