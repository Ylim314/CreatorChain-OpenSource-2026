/**
 * 哈希验证和分析工具
 * 用于验证CreatorChain系统中各种哈希值的格式和有效性
 */

// 示例数据
const examples = {
  txHash: "0xd14857e9c579f7f0333d386eb6982855ecc41294a8e83eed8de1e62759034701",
  confirmTxHash: "0x649d934c7568d148372ff84431e8c6256bb0e4b21009f09c205b79dfe3a78688",
  ipfsHash: "Qm3f4a37cc2a659f9a069d444cbce390bd62f75704e07a",
  address: "0xa82ff6d90261b0a17a5d0a9060b1139185751a12"
};

/**
 * 分析哈希信息
 */
function analyzeHash(hash, name) {
  console.log(`\n=== ${name} ===`);
  console.log(`原始值: ${hash}`);
  console.log(`总长度: ${hash.length} 个字符`);
  
  if (hash.startsWith("0x")) {
    const hexPart = hash.substring(2);
    console.log(`十六进制部分: ${hexPart.length} 位`);
    console.log(`字节数: ${hexPart.length / 2} 字节`);
    console.log(`二进制位: ${hexPart.length * 4} 位`);
    console.log(`算法: Keccak-256`);
  } else if (hash.startsWith("Qm")) {
    console.log(`格式: IPFS CIDv0`);
    console.log(`Base58部分: ${hash.length - 2} 位`);
    console.log(`编码: Base58 (SHA-256)`);
    console.log(`二进制位: ~256 位`);
  }
}

/**
 * 验证哈希格式
 */
function validateHash(hash, type) {
  const validators = {
    txHash: /^0x[a-fA-F0-9]{64}$/,
    address: /^0x[a-fA-F0-9]{40}$/,
    ipfsHash: /^Qm[a-zA-Z0-9]{44}$/
  };
  
  const isValid = validators[type]?.test(hash) ?? false;
  console.log(`\n${type} 格式验证: ${isValid ? '✅ 有效' : '❌ 无效'}`);
  return isValid;
}

/**
 * 计算碰撞概率
 */
function calculateCollisionProbability(bits) {
  console.log(`\n=== ${bits}位哈希的安全性 ===`);
  console.log(`可能的组合数: 2^${bits} ≈ ${Math.pow(2, bits / 10).toExponential(2)} × 10^${Math.floor(bits * 0.301)}`);
  console.log(`生日攻击所需尝试: 2^${bits/2} ≈ ${Math.pow(2, bits / 20).toExponential(2)} × 10^${Math.floor(bits * 0.1505)}`);
  
  if (bits >= 256) {
    console.log(`安全级别: ⭐⭐⭐⭐⭐ (几乎不可能碰撞)`);
  } else if (bits >= 160) {
    console.log(`安全级别: ⭐⭐⭐⭐ (非常安全)`);
  } else if (bits >= 128) {
    console.log(`安全级别: ⭐⭐⭐ (安全)`);
  }
}

/**
 * 运行所有分析
 */
function runAnalysis() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║     CreatorChain 哈希分析工具 v1.0                  ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  
  // 分析各个哈希
  analyzeHash(examples.txHash, "注册交易哈希");
  validateHash(examples.txHash, "txHash");
  
  analyzeHash(examples.confirmTxHash, "确认交易哈希");
  validateHash(examples.confirmTxHash, "txHash");
  
  analyzeHash(examples.ipfsHash, "IPFS文件哈希");
  validateHash(examples.ipfsHash, "ipfsHash");
  
  analyzeHash(examples.address, "以太坊地址");
  validateHash(examples.address, "address");
  
  // 安全性分析
  console.log("\n\n╔══════════════════════════════════════════════════════╗");
  console.log("║     安全性分析                                        ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  
  calculateCollisionProbability(256);  // 交易哈希和IPFS哈希
  calculateCollisionProbability(160);  // 以太坊地址
}

/**
 * 编码转换示例
 */
function demonstrateEncoding() {
  console.log("\n\n╔══════════════════════════════════════════════════════╗");
  console.log("║     编码方式对比                                      ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  
  // 示例：256位数据的不同编码
  console.log("\n相同的256位数据，使用不同编码：\n");
  console.log("Base16 (十六进制，以太坊使用):");
  console.log("  字符集: 0-9, a-f (16个)");
  console.log("  长度: 64字符");
  console.log("  示例: d14857e9c579f7f0333d386eb6982855ecc41294a8e83eed8de1e62759034701");
  
  console.log("\nBase58 (IPFS使用):");
  console.log("  字符集: 1-9, A-Z, a-z，去掉 0, O, I, l (58个)");
  console.log("  长度: ~46字符 (含Qm前缀)");
  console.log("  示例: Qm3f4a37cc2a659f9a069d444cbce390bd62f75704e07a");
  console.log("  优势: 更短、无易混淆字符、URL友好");
  
  console.log("\nBase64 (有时用于API传输):");
  console.log("  字符集: A-Z, a-z, 0-9, +, / (64个)");
  console.log("  长度: ~43字符");
  console.log("  优势: 最紧凑、标准化");
}

/**
 * Gas费用对比
 */
function compareGasCosts() {
  console.log("\n\n╔══════════════════════════════════════════════════════╗");
  console.log("║     链上存储成本分析                                  ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  
  const gasPricePerByte = 20000; // 估算值
  
  console.log("\nSolidity 数据类型存储成本（估算）:\n");
  console.log("bytes32 (32字节): ~640,000 gas");
  console.log("bytes20 (20字节): ~400,000 gas (地址大小)");
  console.log("bytes16 (16字节): ~320,000 gas");
  console.log("bytes8  (8字节):  ~160,000 gas");
  
  console.log("\n这就是为什么：");
  console.log("✅ 以太坊地址用160位而不是256位");
  console.log("✅ 链上只存哈希，实际文件放IPFS");
  console.log("✅ 能用bytes20就不用bytes32");
}

// 运行所有分析
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeHash, validateHash, calculateCollisionProbability };
}

// 在Node.js中直接运行
if (require.main === module) {
  runAnalysis();
  demonstrateEncoding();
  compareGasCosts();
}
