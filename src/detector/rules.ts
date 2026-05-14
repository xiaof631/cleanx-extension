export interface RuleDefinition {
  id: string;
  label: string;
  score: number;
  keywords?: string[];
  patterns?: RegExp[];
}

export const randomSuffixPatterns = [
  /[a-z][a-z0-9_]{3,}\d{4,}$/i,
  /[a-z]+\d+[a-z]+\d+/i,
  /^[a-z]{3,8}$/i
];

export const bioKeywordRules: RuleDefinition[] = [
  {
    id: "bio_lead_generation",
    label: "简介疑似导流",
    score: 30,
    keywords: ["看主页", "私信", "加我", "备用号", "主页有", "联系我", "dm me", "link in bio"]
  },
  {
    id: "bio_adult_marketing",
    label: "简介疑似成人导流",
    score: 35,
    keywords: ["约", "福利", "裸聊", "成人视频", "onlyfans", "fansly"]
  }
];

export const usernameRules: RuleDefinition[] = [
  {
    id: "username_random_suffix",
    label: "用户名疑似批量生成",
    score: 12,
    patterns: randomSuffixPatterns
  },
  {
    id: "username_spam_terms",
    label: "用户名含营销特征",
    score: 15,
    keywords: ["promo", "deal", "airdrop", "giveaway", "casino", "bet"]
  }
];

export const displayNameRules: RuleDefinition[] = [
  {
    id: "display_name_lead_generation",
    label: "昵称疑似导流",
    score: 20,
    keywords: ["私信", "接推广", "互关", "返现", "空投", "福利"]
  },
  {
    id: "display_name_emotional_bait",
    label: "昵称疑似情绪诱导",
    score: 15,
    keywords: ["少女", "学姐", "求抱抱", "线下", "哥哥"],
    patterns: [/^[^\n]{0,12}[♡❤♥]\s*$/u]
  }
];

export const textKeywordRules: RuleDefinition[] = [
  {
    id: "text_lead_generation",
    label: "正文疑似导流",
    score: 25,
    keywords: ["点我主页", "看我主页", "私信我", "加我", "领取空投", "开户链接", "限时返现"]
  },
  {
    id: "text_crypto_spam",
    label: "正文疑似加密营销",
    score: 18,
    keywords: ["airdrop", "presale", "100x", "claim now", "free mint"]
  },
  {
    id: "text_adult_spam",
    label: "正文疑似成人营销",
    score: 28,
    keywords: ["onlyfans", "fansly", "nsfw", "裸聊", "成人视频"]
  },
  {
    id: "text_emotional_bait",
    label: "正文疑似情绪诱导引流",
    score: 30,
    keywords: [
      "求抱抱",
      "会疼人的哥哥",
      "线下的哥哥",
      "线下哥哥",
      "会疼人的姐姐",
      "求收留",
      "求带走",
      "人间",
      "惜君",
      "小心壶",
      "心壶",
      "余生",
      "半生",
      "随心",
      "自在",
      "温柔",
      "心无波澜",
      "世事",
      "变迁",
      "安然"
    ],
    patterns: [
      /想找.{0,8}(哥哥|姐姐|对象)/u,
      /dd个线下.{0,6}(哥哥|姐姐|对象)?/iu,
      /(?:小狗|猫咪).{0,4}求抱抱/u,
      /会疼人.{0,6}(哥哥|姐姐|对象)/u,
      /求(收留|带走)/u,
      /心[忘觉归映]/u,
      /人间/u,
      /岁月/u,
      /心壶/u,
      /余生/u,
      /半生/u,
      /心无波澜/u,
      /世事/u,
      /变迁/u,
      /安然/u
    ]
  }
];

export const suspiciousLinkPatterns = [
  /bit\.ly/i,
  /t\.co\/[a-z0-9]+/i,
  /tinyurl\.com/i,
  /linktr\.ee/i,
  /cutt\.ly/i,
  /rebrand\.ly/i
];
