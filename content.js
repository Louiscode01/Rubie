// content.js — bilingual content for Rubie Yu's portfolio.
// Populated from Rubie's CV. "[add …]" marks fields still to be confirmed.

window.PORTFOLIO_CONTENT = {
  meta: {
    // name.zh is romanized for now — replace with the correct Chinese characters.
    name: { en: "Rubie Yu", zh: "Rubie Yu" },
    role: {
      en: "Psychology · Architecture",
      zh: "心理学 · 建筑学",
    },
    tagline: {
      en: "How does the shape of a space shape the mind that moves through it?",
      zh: "空间的形状，如何塑造在其中穿行的心智？",
    },
  },

  buildings: {
    pavilion: {
      key: "about",
      name: { en: "Pavilion", zh: "亭" },
      hint: { en: "About", zh: "关于" },
    },
    pond: {
      key: "projects",
      name: { en: "Lotus Pond", zh: "荷花池" },
      hint: { en: "Experience", zh: "经历" },
    },
    study: {
      key: "publications",
      name: { en: "Study", zh: "书斋" },
      hint: { en: "Education", zh: "教育" },
    },
    corridor: {
      key: "contact",
      name: { en: "Corridor", zh: "回廊" },
      hint: { en: "Contact", zh: "联系" },
    },
  },

  about: {
    title: { en: "About", zh: "关于" },
    subtitle: { en: "In the pavilion", zh: "亭中" },
    bio: {
      en: [
        "Rubie Yu is a psychology researcher with a background in architecture. She holds a B.S. in Psychology, with a minor in Architecture, from the University of Pittsburgh.",
        "Her research experience is wide-ranging. Across labs at the University of Pittsburgh, UPMC, and Carnegie Mellon University, she has contributed to human-subjects studies spanning youth and family wellbeing, behavioral immunology, and memory — hands-on, collaborative work with studies and the people in them.",
        "Her architecture minor and her years as a scenic artist in the theatre share a single thread with her psychology: an attention to how people read, move through, and are shaped by the spaces around them.",
      ],
      zh: [
        "Rubie Yu 是一位拥有建筑学背景的心理学研究者。她于匹兹堡大学取得心理学理学学士学位，并辅修建筑学。",
        "她的研究经历十分广泛。在匹兹堡大学、UPMC 与卡内基梅隆大学的多个实验室，她参与过涵盖青少年与家庭福祉、行为免疫学与记忆等方向的人类被试研究——亲手参与，与一项项研究、与研究中的人一同协作。",
        "她的建筑学辅修，以及在剧场担任舞台绘景师的数年时光，与她的心理学共享同一条线索：关注人如何阅读空间、在其中穿行，又如何被周遭的空间所塑造。",
      ],
    },
    affiliations: {
      en: [
        ["Degree", "B.S. Psychology · Architecture minor"],
        ["University", "University of Pittsburgh"],
        ["Skills", "Social research · Team leadership"],
        ["Based in", "Pittsburgh, Pennsylvania"],
      ],
      zh: [
        ["学位", "心理学学士 · 建筑学辅修"],
        ["院校", "匹兹堡大学"],
        ["技能", "社会研究 · 团队领导"],
        ["所在", "美国宾夕法尼亚州匹兹堡"],
      ],
    },
  },

  projects: {
    title: { en: "Experience", zh: "经历" },
    subtitle: { en: "Across the pond", zh: "池畔" },
    intro: {
      en: "Research, theatre, and mentorship across the University of Pittsburgh, UPMC, and Carnegie Mellon University — collaborative, hands-on work with studies and the people in them.",
      zh: "横跨匹兹堡大学、UPMC 与卡内基梅隆大学的研究、舞台与指导工作——与一项项研究、与研究中的人，一同动手完成。",
    },
    items: [
      {
        kind: { en: "Research", zh: "研究" },
        title: { en: "Research Associate, SHER Lab", zh: "研究助理 · SHER 实验室" },
        blurb: {
          en: "Research associate at Carnegie Mellon University's SHER Lab, contributing to the lab's ongoing human-subjects research.",
          zh: "在卡内基梅隆大学 SHER 实验室担任研究助理，参与实验室进行中的人类被试研究。",
        },
        year: "2024–2025",
        slot: "proj-01",
      },
      {
        kind: { en: "Research", zh: "研究" },
        title: { en: "Research Assistant, Youth & Family Research Program", zh: "研究助理 · 青少年与家庭研究项目" },
        blurb: {
          en: "Volunteer research assistant with UPMC's Youth and Family Research Program, supporting studies on youth and family wellbeing.",
          zh: "在 UPMC 青少年与家庭研究项目担任志愿研究助理，协助开展关于青少年与家庭福祉的研究。",
        },
        year: "2023–present",
        slot: "proj-02",
      },
      {
        kind: { en: "Research", zh: "研究" },
        title: { en: "Research Assistant, Behavioral Immunology Lab", zh: "研究助理 · 行为免疫学实验室" },
        blurb: {
          en: "Undergraduate research assistant in the University of Pittsburgh's Behavioral Immunology Lab, supporting studies on the links between behavior and immune function.",
          zh: "在匹兹堡大学行为免疫学实验室担任本科研究助理，协助研究行为与免疫功能之间的关联。",
        },
        year: "2022–2024",
        slot: "proj-03",
      },
      {
        kind: { en: "Research", zh: "研究" },
        title: { en: "Research Assistant, ReMind Study", zh: "研究助理 · ReMind 研究" },
        blurb: {
          en: "Undergraduate research assistant on the ReMind Study at the University of Pittsburgh.",
          zh: "在匹兹堡大学 ReMind 研究担任本科研究助理。",
        },
        year: "2022–2024",
        slot: "proj-04",
      },
      {
        kind: { en: "Research", zh: "研究" },
        title: { en: "Research Assistant, KEY Study", zh: "研究助理 · KEY 研究" },
        blurb: {
          en: "Undergraduate research assistant on UPMC's KEY Study.",
          zh: "在 UPMC 的 KEY 研究担任本科研究助理。",
        },
        year: "2022–2023",
        slot: "proj-05",
      },
      {
        kind: { en: "Scenic Art", zh: "舞台美术" },
        title: { en: "Scenic Artist, Department of Theatre Arts", zh: "舞台绘景师 · 戏剧艺术系" },
        blurb: {
          en: "Scenic artist with the University of Pittsburgh's Department of Theatre Arts, painting and finishing sets for stage productions.",
          zh: "在匹兹堡大学戏剧艺术系担任舞台绘景师，为舞台演出绘制与制作布景。",
        },
        year: "2023–2025",
        slot: "proj-06",
      },
      {
        kind: { en: "Mentorship", zh: "指导" },
        title: { en: "Mentor, Disability Resources & Services", zh: "导师 · 残障资源与服务中心" },
        blurb: {
          en: "Peer mentor with the University of Pittsburgh's Disability Resources and Services, supporting students through their academic experience.",
          zh: "在匹兹堡大学残障资源与服务中心担任朋辈导师，在学业过程中为学生提供支持。",
        },
        year: "2023–2024",
        slot: "proj-07",
      },
    ],
  },

  publications: {
    title: { en: "Education", zh: "教育" },
    subtitle: { en: "From the study", zh: "书斋之内" },
    items: [
      {
        title: {
          en: "Bachelor of Science, Psychology",
          zh: "理学学士 · 心理学",
        },
        authors: "",
        venue: { en: "University of Pittsburgh", zh: "匹兹堡大学" },
        year: "2020–2024",
        abstract: {
          en: "Four years of psychology at the University of Pittsburgh — a foundation in social research, human behavior, and the methods of running rigorous human-subjects studies.",
          zh: "在匹兹堡大学修读心理学四年——打下社会研究、人类行为，以及严谨人类被试研究方法的基础。",
        },
      },
      {
        title: {
          en: "Minor, Architecture",
          zh: "建筑学辅修",
        },
        authors: "",
        venue: { en: "University of Pittsburgh", zh: "匹兹堡大学" },
        year: "2023–2024",
        abstract: {
          en: "A minor in architecture — studying how built space is drawn, structured, and experienced, a complement to her work in psychology.",
          zh: "建筑学辅修——研习建成空间如何被绘制、建构与体验，与她的心理学工作彼此呼应。",
        },
      },
    ],
  },

  contact: {
    title: { en: "Contact", zh: "联系" },
    subtitle: { en: "Along the corridor", zh: "回廊之上" },
    invitation: {
      en: "Rubie is open to research collaboration, new projects, and conversations at the meeting point of psychology and the built environment.",
      zh: "Rubie 欢迎研究合作、新的项目，以及在心理学与建成环境交汇处展开的交流。",
    },
    channels: [
      { label: { en: "Email", zh: "邮箱" }, value: { en: "[add email]", zh: "[填写邮箱]" } },
      { label: { en: "LinkedIn", zh: "领英" }, value: "linkedin.com/in/yuetong-yu-6566032b7" },
      { label: { en: "Location", zh: "所在" }, value: { en: "Pittsburgh, Pennsylvania, USA", zh: "美国宾夕法尼亚州匹兹堡" } },
      { label: { en: "CV / Résumé", zh: "简历" }, value: { en: "Available on request", zh: "可应索取" } },
    ],
  },
};
