// src/data/productData.js
const products = [
  // 基本消费品
  {
    productId: 101,
    name: "Quantum Cola",
    price: 2.50,
    description: "Refreshing cyberpunk-themed soda",
    category: "food",
    svmId: [1, 2, 3, 5, 12, 13]
  },
  {
    productId: 102,
    name: "Neon Chips",
    price: 3.00,
    description: "Crunchy chips with glowing flavor",
    category: "food",
    svmId: [1, 2, 5, 13]
  },
  {
    productId: 103,
    name: "Digital Sandwich",
    price: 4.50,
    description: "Futuristic nutrient-packed sandwich",
    category: "food",
    svmId: [1, 3, 5, 12]
  },
  {
    productId: 104,
    name: "Holo-Water",
    price: 1.75,
    description: "Ultra-purified water with electrolytes",
    category: "drink",
    svmId: [1, 2, 3, 5, 12, 13]
  },
  {
    productId: 105,
    name: "Byte Bars",
    price: 2.25,
    description: "Energy-boosting protein bars",
    category: "food",
    svmId: [1, 2, 3, 5]
  },
  
  // 任务相关工具 - SVM-05 Data Heist任务所需
  {
    productId: 201,
    name: "CorpSec Hacking Tool",
    price: 250,
    description: "用于入侵CorpSec安全系统的专业工具，可以绕过基础级别的防火墙和监控系统",
    category: "tool",
    itemId: "hacking_tool_corpsec", // 与脚本中使用的ID匹配
    svmId: [7]
  },
  {
    productId: 202,
    name: "Data Spike",
    price: 150,
    description: "用于快速提取数据的尖端设备，可以绕过标准加密并复制受保护的数据",
    category: "tool",
    itemId: "data_spike", // 与脚本中使用的ID匹配
    svmId: [7]
  },
  {
    productId: 203,
    name: "废旧家具",
    price: 50,
    description: "一件看似普通的废旧家具，但它的内部隐藏着重要的线索。",
    category: "furniture",
    itemId: "old_furniture", // 与脚本中使用的ID匹配
    svmId: [9]
  }
];

export default products;