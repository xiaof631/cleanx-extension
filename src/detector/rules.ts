export interface RuleDefinition {
  id: string;
  label: string;
  score: number;
  keywords?: string[];
  patterns?: RegExp[];
}

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
    score: 10,
    patterns: [/[a-z]{4,}\d{5,}$/i, /[a-z]+\d+[a-z]+\d+/i]
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
