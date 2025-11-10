// jest.config.cjs
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.(ts|tsx|js)"],
  setupFilesAfterEnv: ["./jest.setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  // transformIgnorePatterns: ['/node_modules/(?!(MODULE_TO_TRANSFORM)/)']
};
