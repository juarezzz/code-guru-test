module.exports = {
  moduleNameMapper: {
    "^_(.*)$": "<rootDir>/src/$1"
  },
  roots: ['<rootDir>/src', '<rootDir>/build'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
