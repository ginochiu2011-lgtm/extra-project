export const DEFAULT_ACTIVITIES = [
  { 
    id: 0, 
    isOfficial: true, 
    tag: "拉新福利", 
    category: "非常艺术", 
    title: "【首场旗舰】非常记录：0门槛亲子摄影大赛，用手机赢取万元大礼", 
    host: "EXTRA 官推", 
    price: 0,
    capacity: 5000,
    joined: 1290,
    lifecycleStatus: "online",
    stats: [20, 100, 30, 40, 90], 
    cover: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80", 
    location: "线上投稿 / 线下巡展", 
    lat: 39.910, lng: 116.405,
    statusText: "报名中 · 已有1290位家长参赛", 
    matchScore: 99,
    labels: ["0元参与", "拉新奖励", "专业评审"],
    venueType: 'PUBLIC',
  },
  { 
    id: 3, 
    tag: "精选搭子局", 
    category: "非常自然", 
    title: "【家长互助】奥森公园野餐：寻找3个爱摄影的家长拍娃", 
    host: "王大星", 
    price: 0,
    capacity: 5,
    joined: 3,
    lifecycleStatus: "online",
    stats: [80, 50, 40, 60, 70], 
    cover: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80", 
    location: "朝阳 · 奥森公园", 
    lat: 39.992, lng: 116.388,
    statusText: "报名中 · 剩余2个名额", 
    matchScore: 82,
    labels: ["新手友好", "互助免费"],
    venueType: 'PUBLIC',
  },
  { 
    id: 4, 
    tag: "官方研学局", 
    category: "非常科学", 
    title: "中科院标本馆深度行：招募3组家庭一起请高级讲解", 
    host: "EXTRA 官方", 
    price: 158,
    capacity: 3,
    joined: 3,
    lifecycleStatus: "FULL",
    stats: [30, 20, 100, 50, 40], 
    cover: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80", 
    location: "海淀 · 标本馆 · 官方研学路线", 
    lat: 39.995, lng: 116.318,
    statusText: "官方示例 · 已满员", 
    matchScore: 95,
    labels: ["官方合作", "中科院标本馆", "深度研学"],
    venueType: 'COMMERCIAL',
    isOfficial: true,
  },
  { 
    id: 5, 
    tag: "官方工厂参观局", 
    category: "非常科学", 
    title: "小米智能制造参观日：走进手机工厂的幕后", 
    host: "EXTRA 官方", 
    price: 0,
    capacity: 3,
    joined: 2,
    lifecycleStatus: "ONLINE",
    stats: [40, 20, 95, 40, 30], 
    cover: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80", 
    location: "昌平 · 小米智能制造园区 · 官方参观路线", 
    lat: 40.223, lng: 116.228,
    statusText: "官方示例 · 报名中", 
    matchScore: 96,
    labels: ["官方合作", "小米工厂", "工厂参观"],
    venueType: 'COMMERCIAL',
    isOfficial: true,
  }
];

export const DEFAULT_PLACES = [
  {
    id: 1,
    name: "阿那亚蜂巢剧场",
    category: "艺术策展",
    rating: 4.9,
    distance: "1.2km",
    address: "北戴河 · 阿那亚",
    match: 94,
    cover: "https://images.unsplash.com/photo-1518998053901-55d8d3961a00?auto=format&fit=crop&w=600&q=80",
    lat: 39.708,
    lng: 119.301,
    summary: "临海的蜂巢剧场，剧场结构本身就是装置艺术，站在任何一个角度都很有画面感。",
    vibe: "极强仪式感的海边剧场空间，适合高完成度的首演与沉浸式体验。",
    spaceTags: ["海边", "剧场座位", "强仪式感", "可控灯光", "舞台设备"],
    capabilityTags: ["有电源", "可投影", "可控灯光"],
    playbook: {
      day: [
        {
          title: "白天：海边戏剧工作坊",
          summary: "利用自然光和海风，做肢体表达、声音练习和亲子小剧场排练。"
        }
      ],
      night: [
        {
          title: "夜晚：小型首演 / 影像放映",
          summary: "通过舞台灯光+音乐，承接完成度较高的作品呈现，也适合品牌联合放映。"
        }
      ],
      season: [
        {
          title: "节日限定：海边节庆大合照",
          summary: "在蜂巢台阶做大合照或家庭仪式感打卡，配合简单的道具即可出片。"
        }
      ]
    },
    poi: [
      { name: "主舞台台阶", tip: "拍摄全景和大合照的最佳机位。" },
      { name: "靠海一侧观景位", tip: "适合家长安静休息与观景。" }
    ],
    rules: [
      "现场不可使用明火及烟花类道具。",
      "音量需控制在剧场运营允许范围内，避免影响周边住客。"
    ],
    caseStudies: [
      {
        title: "家庭戏剧首演方案",
        description: "3-5 组家庭，包含 2 小时场地使用 + 基础灯光 + 简单声音测试。",
        price: 3500,
        unit: "每场",
        families: "3-5 组家庭"
      },
      {
        title: "品牌联名观影夜",
        description: "小规模品牌联合包场，含 3 小时场地 + 灯光音响基础支持。",
        price: 6800,
        unit: "每场",
        families: "10 组家庭以内"
      }
    ],
    cases: [
      {
        title: "亲子小剧场首演",
        time: "周末傍晚 · 夏季",
        curator: "EXTRA 策展团队",
        summary: "3 组家庭联合完成 20 分钟原创亲子剧，从排练到首演全程在蜂巢完成。",
        images: [
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1515165562835-c4c9e0737eaa?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    caseImages: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515165562835-c4c9e0737eaa?auto=format&fit=crop&w=800&q=80"
    ],
    ownershipType: 'COMMERCIAL',
  },
  {
    id: 2,
    name: "SKP-S 亲子艺术空间",
    category: "策展零售",
    rating: 4.8,
    distance: "0.8km",
    address: "朝阳 · 大望路",
    match: 91,
    cover: "https://images.unsplash.com/photo-1567449303078-57ad995bd301?auto=format&fit=crop&w=600&q=80",
    lat: 39.908,
    lng: 116.458,
    summary: "位于潮流商场内部的开放展陈空间，天然自带人流与陈列氛围。",
    vibe: "明亮、现代、略带先锋气质的城市室内空间，适合快闪与共创。",
    spaceTags: ["室内", "商场客流", "可陈列", "电梯直达", "适合工作坊"],
    capabilityTags: ["有电源", "可投影", "可封场"],
    playbook: {
      day: [
        {
          title: "白天：开放式手作工作坊",
          summary: "利用通透视线吸引路人参与，适合 3–6 组家庭滚动参与。"
        }
      ],
      rain: [
        {
          title: "雨天：室内城市观察局",
          summary: "结合商场橱窗、装置做“城市细节观察任务”，从空间走向城市。"
        }
      ]
    },
    poi: [
      { name: "主展陈区", tip: "适合布置装置或作品陈列墙。" },
      { name: "入口走廊", tip: "容易形成自然人流停留区，适合快闪互动。" }
    ],
    rules: [
      "需要提前与商场确认噪音与人流边界。",
      "不建议使用大量粉尘/水类材料，避免地面打滑。"
    ],
    caseStudies: [
      {
        title: "亲子艺术共创展陈（半天）",
        description: "3-6 组家庭，半天展陈 + 共创工作坊基础支持。",
        price: 2800,
        unit: "半天",
        families: "3-6 组家庭"
      },
      {
        title: "周末快闪艺术局",
        description: "面向大众开放的亲子艺术快闪，含基础布置和场地协调。",
        price: 5200,
        unit: "每场",
        families: "开放人流"
      }
    ],
    cases: [
      {
        title: "亲子艺术共创展陈",
        time: "周末下午 · 春季",
        curator: "EXTRA 策展团队",
        summary: "家长与孩子共同完成小作品，现场即刻上墙展出，形成 2 小时小型展览。",
        images: [
          "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    caseImages: [
      "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80",
    ],
    ownershipType: 'COMMERCIAL',
  },
  {
    id: 3,
    name: "奥森公园",
    category: "自然户外",
    rating: 4.9,
    distance: "2.1km",
    address: "朝阳 · 奥森公园",
    match: 89,
    cover: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80",
    lat: 39.992,
    lng: 116.388,
    summary: "城市中的大型自然公园，地形多样，有开阔草地也有树林与水系。",
    vibe: "高可塑性的城市自然场域，从轻松遛娃到主题自然观察都能撑得住。",
    spaceTags: ["户外", "大草地", "树林", "近水域", "适合放电", "推车可达"],
    capabilityTags: ["大草坪", "有遮阴", "无固定电源"],
    playbook: {
      day: [
        {
          title: "白天：自然观察 + 轻野餐",
          summary: "先在树林和水边做 60 分钟自然任务，再在大草地铺垫子野餐。"
        }
      ],
      night: [
        {
          title: "傍晚：金色时刻摄影局",
          summary: "利用日落前后 1 小时在林间小道和草地拍摄家庭照。"
        }
      ],
      rain: [
        {
          title: "雨后：泥巴与小生物观察",
          summary: "选择安全、无积水的区域，观察蜗牛、蚯蚓等小生命。"
        }
      ]
    },
    poi: [
      { name: "南门入口", tip: "适合约集合的标准点位，地铁出口近。" },
      { name: "中心大草坪", tip: "放电与大地游戏的主场地，视野开阔方便看娃。" },
      { name: "临水步道", tip: "需要强调安全边界，适合做“远观不接触”的观察活动。" }
    ],
    rules: [
      "不可明火，建议使用冷餐或保温壶。",
      "临水区域需有足够大人看护，不建议低龄儿童单独靠近。"
    ],
    cases: [
      {
        title: "3 家家庭自然观察小队",
        time: "周日早上 · 秋季",
        curator: "王大星",
        summary: "3 组家庭围绕落叶和种子做观察任务，最后在草地分享成果。",
        images: [
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1444210971048-6130cf0c46cf?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    caseImages: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1444210971048-6130cf0c46cf?auto=format&fit=crop&w=800&q=80",
    ],
    ownershipType: 'PUBLIC',
  },
  {
    id: 4,
    name: "小米智能制造参观基地",
    category: "企业参观",
    rating: 4.8,
    distance: "18km",
    address: "北京 · 昌平 · 小米智能制造园区",
    match: 92,
    cover:
      "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80",
    lat: 40.223,
    lng: 116.228,
    summary:
      "面向家庭开放的智能制造参观路线，了解手机从零件到成品的全流程，适合对科技与工程感兴趣的孩子。",
    vibe:
      "节奏有条理、信息量大，由官方讲解员带队，更偏向“企业开放日 + 研学”的体验。",
    spaceTags: ["企业园区", "智能制造", "参观动线", "讲解区", "展示厅"],
    capabilityTags: ["有电源", "可投影", "固定路线讲解"],
    playbook: {
      day: [
        {
          title: "生产线参观",
          summary:
            "跟随官方讲解员，沿固定动线了解手机生产的关键工序，看到机器人手臂、测试实验室等环节。"
        }
      ],
      night: [],
      rain: []
    },
    poi: [
      { name: "展示大厅", tip: "适合讲解产品演进史和品牌故事。" },
      { name: "观摩通道", tip: "可以安全距离观看自动化产线运作。" }
    ],
    rules: [
      "需提前按批次预约参观，现场不接受临时散客。",
      "不得在生产区域拍摄涉及工艺细节的特写画面。",
      "儿童需在家长陪同下，全程听从讲解员与安保指引。"
    ],
    labels: ["官方合作", "企业场地", "小米工厂"],
    ownershipType: 'ENTERPRISE',
    hiddenInPlaceList: true,
    allowDirectorCoop: false,
  },
  {
    id: 5,
    name: "EXTRA X 叮咚买菜 · 光明农场",
    category: "品牌联名",
    rating: 4.7,
    distance: "约 35km",
    address: "上海 · 崇明 · 光明生态农场",
    match: 90,
    cover:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    lat: 31.62,
    lng: 121.5,
    summary:
      "EXTRA 联合叮咚买菜与光明农场，共同策划的品牌联名农场开放日，带孩子走进真实的供应链现场。",
    vibe:
      "半天到一天的“从田间到餐桌”之旅，有官方讲解、采摘体验和简单料理环节，更偏向品牌共建型活动。",
    spaceTags: ["企业农场", "采摘区", "奶牛区", "冷链参观", "品牌展区"],
    capabilityTags: ["有电源", "可投影", "官方讲解", "固定参观路线"],
    playbook: {
      day: [
        {
          title: "农场参观 + 采摘体验",
          summary:
            "跟随光明农场与叮咚买菜的官方讲解，从田间采摘、冷链运输到到家配送，完整体验一盒牛奶/一捆菜的旅程。"
        }
      ],
      night: [],
      rain: []
    },
    poi: [
      { name: "品牌联合展区", tip: "适合做品牌故事讲解和合影打卡。" },
      { name: "采摘区", tip: "安排在安全区域，适合亲子采摘与简单任务打卡。" }
    ],
    rules: [
      "需通过平台或品牌官方渠道统一报名，现场不接受散客。",
      "参观过程中需听从工作人员指引，不可进入未开放生产区域。",
      "涉及动物区域需注意卫生与安全，避免直接喂食未经允许的饲料。"
    ],
    labels: ["官方合作", "品牌联名", "光明农场"],
    ownershipType: 'ENTERPRISE',
    allowDirectorCoop: true,
  },
  // 场地主入驻灵感场地 Demo
  {
    id: 100,
    name: "日光花园 · 城市亲子会所（DEMO）",
    category: "城市空间",
    rating: 4.8,
    distance: "灵感示例",
    address: "北京 · 朝阳 · 某创意园区",
    match: 90,
    cover: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    lat: 39.9,
    lng: 116.4,
    isOwnerSubmitted: true,
    suggestedUse: "适合小型艺术手作局、摄影光影实验局，最多 5-6 组家庭，安静舒适。",
    vibe: "安静、充满绿植与自然光的城市角落，适合深度、慢节奏的亲子相处。",
    spaceTags: ["室内", "自然光", "绿植多", "安静", "可包场"],
    capabilityTags: ["有电源", "小场景布光", "可封场"],
    playbook: {
      day: [
        {
          title: "白天：光影手作局",
          summary: "利用落地窗自然光做影子画、光影摄影等低噪音活动。"
        }
      ],
      night: [
        {
          title: "夜晚：小型读书会 / 垫子局",
          summary: "灯光柔和，适合几组家庭席地而坐做阅读、桌游与深聊。"
        }
      ]
    },
    poi: [
      { name: "落地窗阅读角", tip: "自然光最好的位置，适合拍照与安静活动。" },
      { name: "中央大桌", tip: "适合手作、桌游和小型分享会。" }
    ],
    rules: [
      "建议控制在 5–6 组家庭以内，保证空间舒适度。",
      "不支持高强度奔跑放电活动，更适合安静型玩法。"
    ],
    cases: [
      {
        title: "亲子光影实验小局",
        time: "工作日傍晚 · 冬季",
        curator: "日光花园场地主",
        summary: "2 组家庭利用手电与玻璃器皿做光影实验，并现场记录成小册子。",
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    ownershipType: 'PRIVATE',
  },
];

