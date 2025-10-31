// 安全的ethers.js v6包装器
import { BrowserProvider, isAddress, formatEther, parseEther, Contract } from 'ethers';

const safeEthers = {
  getBrowserProvider() {
    try {
      // ethers v6 直接导出 BrowserProvider
      if (BrowserProvider) {
        return BrowserProvider;
      }
      throw new Error('BrowserProvider not available');
    } catch (error) {
      console.error('❌ ethers.js provider error:', error);
      throw new Error('ethers.js provider not available');
    }
  },

  isAddress(address) {
    try {
      // ethers v6 直接导出 isAddress
      return isAddress(address);
    } catch (error) {
      console.warn('isAddress check failed:', error);
      return false;
    }
  },

  formatEther(value) {
    try {
      // ethers v6 直接导出 formatEther
      return formatEther(value);
    } catch (error) {
      console.warn('formatEther failed:', error);
      return value?.toString() || '0';
    }
  },

  parseEther(value) {
    try {
      // ethers v6 直接导出 parseEther
      return parseEther(value);
    } catch (error) {
      console.warn('parseEther failed:', error);
      return value;
    }
  },

  createContract(address, abi, signer) {
    try {
      // ethers v6 直接导出 Contract
      return new Contract(address, abi, signer);
    } catch (error) {
      console.error('createContract failed:', error);
      throw new Error('ethers.js 未加载');
    }
  },

  // 同步方法
  isAddressSync: (address) => {
    try {
      return isAddress(address);
    } catch (error) {
      return false;
    }
  },

  formatEtherSync: (value) => {
    try {
      return formatEther(value);
    } catch (error) {
      return value?.toString() || '0';
    }
  },

  parseEtherSync: (value) => {
    try {
      return parseEther(value);
    } catch (error) {
      return value;
    }
  },
};

export default safeEthers;