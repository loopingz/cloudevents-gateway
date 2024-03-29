module.exports = {
  roots: ["src"],
  testMatch: ["**/?(*.)+(spec|test).+(ts|tsx|js)"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  collectCoverage: true,
  coverageReporters: ["json", "html", "text"]
};
