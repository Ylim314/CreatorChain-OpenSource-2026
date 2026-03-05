import "@nomicfoundation/hardhat-ethers";

const localAccounts = process.env.LEGACY_LOCAL_PRIVATE_KEYS
  ? process.env.LEGACY_LOCAL_PRIVATE_KEYS.split(",").map((k) => k.trim()).filter(Boolean)
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: localAccounts
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test"
  }
};
