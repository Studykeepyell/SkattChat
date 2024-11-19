const colors = ["#3CC157", "#2AA7FF", "#1B1B1B", "#FCBC0F", "#F85F36"];

const numBalls = 50;
const balls = [];

for (let i = 0; i < numBalls; i++) {
  let ball = document.createElement("div");
  ball.classList.add("ball");
  ball.style.background = colors[Math.floor(Math.random() * colors.length)];
  ball.style.left = `${Math.floor(Math.random() * 100)}vw`;
  ball.style.top = `${Math.floor(Math.random() * 100)}vh`;
  ball.style.transform = `scale(${Math.random()})`;
  ball.style.width = `${Math.random()}em`;
  ball.style.height = ball.style.width;
  
  balls.push(ball);
  document.body.append(ball);
}

balls.forEach((el, i, ra) => {
  let to = {
    x: Math.random() * (i % 2 === 0 ? -11 : 11),
    y: Math.random() * 12
  };

  let anim = el.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${to.x}rem, ${to.y}rem)` }
    ],
    {
      duration: (Math.random() + 1) * 2000,
      direction: "alternate",
      fill: "both",
      iterations: Infinity,
      easing: "ease-in-out"
    }
  );
});

const translations = {
    en: {
        'brand-name': 'Skychatt',
        'Download': 'Download',
        'Discover': 'Discover',
        'Support': 'Support',
        'Log In': 'Log In',
        'Sign Up': 'Sign Up',
        'Welcome to Skychatt': 'Welcome to Skychatt',
        'Your place to talk and hang out with friends!': 'Your place to talk and hang out with friends!',
        'Create a Server': 'Create a Server',
        'Made with ❤️ by Skychatt Team': 'Made with ❤️ by Skychatt Team',
        'About': 'About',
        'Jobs': 'Jobs',
        'Help': 'Help',
        'Privacy': 'Privacy',
    },
    zh: {
        'brand-name': 'Skychatt (中文)',
        'Download': '下载',
        'Discover': '发现',
        'Support': '支持',
        'Log In': '登录',
        'Sign Up': '注册',
        'Welcome to Skychatt': '欢迎来到 Skychatt',
        'Your place to talk and hang out with friends!': '和朋友们一起聊天、玩耍的地方！',
        'Create a Server': '创建一个服务器',
        'Made with ❤️ by Skychatt Team': '由 Skychatt 团队精心制作 ❤️',
        'About': '关于',
        'Jobs': '招聘',
        'Help': '帮助',
        'Privacy': '隐私',
    },
    fr: {
        'brand-name': 'Skychatt (Français)',
        'Download': 'Télécharger',
        'Discover': 'Découvrir',
        'Support': 'Support',
        'Log In': 'Se connecter',
        'Sign Up': 'S\'inscrire',
        'Welcome to Skychatt': 'Bienvenue sur Skychatt',
        'Your place to talk and hang out with friends!': 'Votre lieu pour discuter et traîner avec vos amis!',
        'Create a Server': 'Créer un serveur',
        'Made with ❤️ by Skychatt Team': 'Fait avec ❤️ par l\'équipe de Skychatt',
        'About': 'À propos',
        'Jobs': 'Emplois',
        'Help': 'Aide',
        'Privacy': 'Confidentialité',
    },
    ar: {
        'brand-name': 'Skychatt (عربى)',
        'Download': 'تحميل',
        'Discover': 'اكتشاف',
        'Support': 'دعم',
        'Log In': 'تسجيل الدخول',
        'Sign Up': 'انشاء حساب',
        'Welcome to Skychatt': 'مرحبا بكم في Skychatt',
        'Your place to talk and hang out with friends!': 'مكانك للتحدث وقضاء الوقت مع الأصدقاء!',
        'Create a Server': 'إنشاء سيرفر',
        'Made with ❤️ by Skychatt Team': 'صُنع مع ❤️ بواسطة فريق Skychatt',
        'About': 'حول',
        'Jobs': 'وظائف',
        'Help': 'مساعدة',
        'Privacy': 'خصوصية',
    }
};

function changeLanguage(language) {
    const elementsToTranslate = document.querySelectorAll('[data-translate]');
    
    elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[language] && translations[language][key]) {
            element.innerText = translations[language][key];
        }
    });
}

document.getElementById('language-selector').addEventListener('change', function() {
    changeLanguage(this.value);
});

changeLanguage('en');
const languageSelector = document.getElementById('language-selector');
const options = document.querySelectorAll('.language-option');
