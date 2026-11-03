/* 第一性原理人生地图 · 领域目录
 * 5 大区 → 8 类 → 40 领域。顺序即首页展示顺序与「上一/下一领域」导航顺序。
 */
window.FP = window.FP || {};
window.FP.domains = window.FP.domains || {};

window.FP.catalog = {
  groups: [
    {
      id: "life",
      name: "人生",
      intro: "先回答「我为什么活、怎样算活得好」，其他一切领域才有锚点。",
      categories: [
        {
          id: "foundation",
          name: "人生底层",
          domains: [
            { id: "life", name: "人生" },
            { id: "self", name: "自我" },
            { id: "freedom", name: "自由" },
            { id: "happiness", name: "幸福" },
            { id: "living", name: "生活" }
          ]
        },
        {
          id: "time-and-circumstance",
          name: "时间与境遇",
          domains: [
            { id: "time", name: "时间" },
            { id: "past", name: "过去" },
            { id: "solitude", name: "孤独" },
            { id: "aging", name: "养老" },
            { id: "travel", name: "旅行" }
          ]
        }
      ]
    },
    {
      id: "relationship",
      name: "关系",
      intro: "人是关系中的人。把关系还原为「两个独立个体之间的价值交换与情感联结」。",
      categories: [
        {
          id: "intimacy-and-family",
          name: "亲密与家庭",
          domains: [
            { id: "family", name: "家庭" },
            { id: "love", name: "爱情" },
            { id: "communication", name: "沟通" },
            { id: "expression", name: "表达" }
          ]
        },
        {
          id: "social-and-interpersonal",
          name: "社交与人际",
          domains: [
            { id: "social", name: "社交" },
            { id: "relationships", name: "人际关系" },
            { id: "workplace-relationships", name: "职场的人际关系" },
            { id: "power", name: "权力" }
          ]
        }
      ]
    },
    {
      id: "growth",
      name: "成长",
      intro: "成长的本质是「认知模型的升级」与「行为模式的重塑」，二者缺一不可。",
      categories: [
        {
          id: "learning-and-cognition",
          name: "学习与认知",
          domains: [
            { id: "education", name: "教育" },
            { id: "learning", name: "学习" },
            { id: "reading", name: "阅读" },
            { id: "growth", name: "成长" },
            { id: "health", name: "健康" }
          ]
        },
        {
          id: "habit-and-mindset",
          name: "习惯与心态",
          domains: [
            { id: "time-management", name: "时间管理" },
            { id: "bad-habits", name: "坏习惯" },
            { id: "mindset", name: "心态" },
            { id: "persistence", name: "坚持" },
            { id: "emotion", name: "情绪管理" },
            { id: "focus", name: "专注" }
          ]
        }
      ]
    },
    {
      id: "career",
      name: "事业",
      intro: "事业的本质是「持续为他人创造可感知的价值，并获得相应回报」。",
      categories: [
        {
          id: "career",
          name: "事业",
          domains: [
            { id: "career", name: "职场" },
            { id: "startup", name: "创业" },
            { id: "getting-things-done", name: "成事" },
            { id: "decision", name: "决策" },
            { id: "choice", name: "选择" },
            { id: "opportunity", name: "机会" },
            { id: "winning", name: "输赢" }
          ]
        }
      ]
    },
    {
      id: "wealth",
      name: "财富",
      intro: "财富不是数字，而是「可以自由支配的时间与选择权」。",
      categories: [
        {
          id: "wealth",
          name: "财富",
          domains: [
            { id: "wealth", name: "财富" },
            { id: "money", name: "金钱" },
            { id: "personal-finance", name: "理财" },
            { id: "investing", name: "投资" }
          ]
        }
      ]
    }
  ]
};
