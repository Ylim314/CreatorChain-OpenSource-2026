// 演示数据服务 - 用于展示全媒体数字资产确权功能
class DemoService {
  constructor() {
    this.baseURL = 'http://localhost:8080/api/v1/ai';
  }

  // 获取演示用的创作类型
  getCreationTypes() {
    return [
      { 
        value: 0, 
        label: "图像", 
        icon: "🖼️", 
        description: "照片、插画、设计图等",
        examples: ["风景照片", "数字插画", "UI设计", "艺术创作"]
      },
      { 
        value: 1, 
        label: "文本", 
        icon: "📝", 
        description: "文章、小说、诗歌等",
        examples: ["技术博客", "短篇小说", "诗歌作品", "学术论文"]
      },
      { 
        value: 2, 
        label: "音频", 
        icon: "🎵", 
        description: "音乐、播客、音效等",
        examples: ["原创音乐", "播客节目", "音效设计", "语音内容"]
      },
      { 
        value: 3, 
        label: "视频", 
        icon: "🎬", 
        description: "短视频、长视频、动画等",
        examples: ["短视频", "教学视频", "动画作品", "纪录片"]
      },
      { 
        value: 4, 
        label: "AI模型", 
        icon: "🤖", 
        description: "AI训练模型、算法等",
        examples: ["机器学习模型", "深度学习算法", "AI工具", "智能系统"]
      },
      { 
        value: 5, 
        label: "代码", 
        icon: "💻", 
        description: "开源代码、脚本等",
        examples: ["开源项目", "工具脚本", "算法实现", "软件组件"]
      },
      { 
        value: 6, 
        label: "游戏", 
        icon: "🎮", 
        description: "游戏资产、关卡设计等",
        examples: ["游戏关卡", "角色设计", "游戏机制", "游戏资产"]
      },
      { 
        value: 7, 
        label: "3D模型", 
        icon: "🎯", 
        description: "3D建模、虚拟资产等",
        examples: ["3D角色", "建筑模型", "虚拟场景", "3D动画"]
      },
      { 
        value: 8, 
        label: "其他", 
        icon: "📦", 
        description: "其他数字内容",
        examples: ["数据文件", "配置文件", "其他格式", "自定义内容"]
      }
    ];
  }

  // 获取演示用的分析结果
  getDemoAnalysis(type) {
    const analyses = {
      0: { // 图像
        type: "image/jpeg",
        size: 2048576, // 2MB
        resolution: "1920x1080",
        colors: ["#FF5733", "#33FF57", "#3357FF", "#F39C12"],
        objects: ["人物", "建筑", "天空", "树木"],
        content_tags: ["风景", "自然", "高清", "专业摄影"],
        metadata: {
          format: "JPEG",
          color_space: "RGB",
          dpi: 300,
          camera: "Canon EOS R5"
        }
      },
      1: { // 文本
        type: "text/plain",
        size: 51200, // 50KB
        content_tags: ["技术文档", "代码", "说明", "教程"],
        metadata: {
          format: "TXT",
          encoding: "UTF-8",
          language: "中文",
          word_count: 1500
        }
      },
      2: { // 音频
        type: "audio/mp3",
        size: 5242880, // 5MB
        duration: 180, // 3分钟
        bit_rate: 320,
        sample_rate: 44100,
        music_tags: ["流行", "电子", "节奏感强", "现代"],
        metadata: {
          format: "MP3",
          channels: 2,
          encoding: "MP3"
        }
      },
      3: { // 视频
        type: "video/mp4",
        size: 52428800, // 50MB
        duration: 120, // 2分钟
        resolution: "1920x1080",
        frame_rate: 30,
        content_tags: ["风景", "自然", "高清", "专业制作"],
        metadata: {
          format: "MP4",
          codec: "H.264",
          bitrate: "5000kbps"
        }
      },
      4: { // AI模型
        type: "application/octet-stream",
        size: 104857600, // 100MB
        content_tags: ["机器学习", "深度学习", "AI", "算法"],
        metadata: {
          format: "BIN",
          framework: "PyTorch",
          model_type: "Neural Network"
        }
      },
      5: { // 代码
        type: "text/plain",
        size: 102400, // 100KB
        content_tags: ["开源", "JavaScript", "工具", "实用"],
        metadata: {
          format: "JS",
          language: "JavaScript",
          framework: "React"
        }
      },
      6: { // 游戏
        type: "application/zip",
        size: 31457280, // 30MB
        content_tags: ["游戏", "关卡设计", "创意", "娱乐"],
        metadata: {
          format: "ZIP",
          game_engine: "Unity",
          platform: "PC"
        }
      },
      7: { // 3D模型
        type: "application/octet-stream",
        size: 15728640, // 15MB
        content_tags: ["3D建模", "角色设计", "虚拟", "艺术"],
        metadata: {
          format: "OBJ",
          software: "Blender",
          polygons: 50000
        }
      },
      8: { // 其他
        type: "application/octet-stream",
        size: 1048576, // 1MB
        content_tags: ["文件", "数据", "其他", "自定义"],
        metadata: {
          format: "BIN",
          category: "unknown"
        }
      }
    };

    return analyses[type] || analyses[8];
  }

  // 获取演示用的IPFS哈希
  getDemoIPFSHash() {
    const hashes = [
      "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      "QmQGi9vCzJk2Xj8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K",
      "QmX8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K",
      "QmZ9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L9L"
    ];
    return hashes[Math.floor(Math.random() * hashes.length)];
  }

  // 获取演示用的零知识证明
  getDemoProof() {
    return {
      proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      public_data: {
        hash: this.getDemoIPFSHash(),
        timestamp: Date.now(),
        creator: "0x742d35Cc6634C0532925a3b8D4C9Db96C4B4d8b6"
      },
      contribution_score: 85,
      process_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      metadata: {
        algorithm: "Schnorr",
        difficulty: "medium",
        verification_time: "2.3s"
      }
    };
  }

  // 模拟内容分析API调用
  async analyzeContent(file, type) {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const analysis = this.getDemoAnalysis(type);
    const ipfsHash = this.getDemoIPFSHash();
    const proof = this.getDemoProof();
    
    return {
      success: true,
      data: {
        file_info: {
          name: file.name,
          size: file.size,
          content_type: file.type
        },
        analysis: analysis,
        ipfs_hash: ipfsHash,
        proof: proof,
        metadata: {
          original_name: file.name,
          content_type: file.type,
          file_size: file.size,
          upload_time: Date.now(),
          analysis: analysis
        },
        timestamp: Date.now()
      }
    };
  }

  // 模拟上传并分析API调用
  async uploadAndAnalyze(file, title, description, type) {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysis = this.getDemoAnalysis(type);
    const ipfsHash = this.getDemoIPFSHash();
    const proof = this.getDemoProof();
    
    return {
      success: true,
      data: {
        creation_info: {
          title: title,
          description: description,
          type: type,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type
        },
        analysis: analysis,
        ipfs_hash: ipfsHash,
        proof: proof,
        metadata: {
          original_name: file.name,
          content_type: file.type,
          file_size: file.size,
          upload_time: Date.now(),
          analysis: analysis
        },
        timestamp: Date.now()
      }
    };
  }
}

export default new DemoService();


