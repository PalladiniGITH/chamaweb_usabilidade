const SegredosDigitais = (() => {
  const storageKey = 'sd-journey';
  const themeKey = 'sd-theme';
  const defaultState = {
    points: 0,
    completed: {},
    quizHighscore: 0,
  };

  const getPageId = () => document.body?.dataset?.page || 'home';

  const safeParse = (value) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Não foi possível carregar o progresso salvo.', error);
      return null;
    }
  };

  const loadState = () => {
    if (!('localStorage' in window)) {
      return { ...defaultState };
    }

    const stored = safeParse(localStorage.getItem(storageKey));
    if (!stored) {
      return { ...defaultState };
    }

    return {
      ...defaultState,
      ...stored,
      completed: { ...defaultState.completed, ...stored.completed },
    };
  };

  let state = loadState();

  const getPointsElement = () => document.getElementById('pointsValue');

  const persistState = () => {
    if ('localStorage' in window) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn('Não foi possível salvar o progresso.', error);
      }
    }
    updatePointsDisplay();
    updateMissionBadges();
  };

  const updatePointsDisplay = () => {
    const target = getPointsElement();
    if (target) {
      target.textContent = state.points.toString();
    }
  };

  const updateMissionBadges = () => {
    document.querySelectorAll('[data-mission]').forEach((card) => {
      const mission = card.dataset.mission;
      card.classList.toggle('is-completed', Boolean(state.completed[mission]));
    });
  };

  const grantBonusPoints = (amount) => {
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount === 0) {
      return;
    }
    state.points = Math.max(0, state.points + amount);
    persistState();
  };

  const markMissionComplete = (mission, reward = 0) => {
    if (!mission) return false;
    if (!state.completed[mission]) {
      state.completed[mission] = true;
      if (typeof reward === 'number' && !Number.isNaN(reward) && reward !== 0) {
        state.points = Math.max(0, state.points + reward);
      }
      persistState();
      return true;
    }
    return false;
  };

  const highlightNavigation = () => {
    const pageId = getPageId();
    document.querySelectorAll('.site-nav a[data-page]').forEach((link) => {
      const isActive = link.dataset.page === pageId;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const setupThemeToggle = () => {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const applyTheme = (theme) => {
      const normalized = theme === 'dark' ? 'dark' : 'light';
      document.body.dataset.theme = normalized;
      toggle.setAttribute(
        'aria-label',
        normalized === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
      );
      if ('localStorage' in window) {
        try {
          localStorage.setItem(themeKey, normalized);
        } catch (error) {
          console.warn('Não foi possível salvar a preferência de tema.', error);
        }
      }
    };

    const storedTheme = 'localStorage' in window ? localStorage.getItem(themeKey) : null;
    if (storedTheme) {
      applyTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    } else {
      applyTheme(document.body.dataset.theme || 'light');
    }

    toggle.addEventListener('click', () => {
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  };

  const setupRestartButton = () => {
    const restartButton = document.getElementById('restartJourney');
    if (!restartButton) return;

    restartButton.addEventListener('click', () => {
      const confirmation = window.confirm('Deseja reiniciar a jornada e zerar os pontos?');
      if (!confirmation) return;

      state = { ...defaultState };
      persistState();
      if ('localStorage' in window) {
        try {
          localStorage.removeItem(storageKey);
        } catch (error) {
          console.warn('Não foi possível limpar o progresso.', error);
        }
      }
      window.location.href = 'index.html';
    });
  };

  const initHome = () => {
    const startButton = document.getElementById('startJourney');
    if (startButton) {
      startButton.addEventListener('click', () => {
        window.location.href = 'cofre.html';
      });
    }
  };

  const initCofre = () => {
    const button = document.getElementById('cofreTrigger');
    const secrets = document.getElementById('cofreSecrets');
    if (!button || !secrets) return;

    const label = button.querySelector('.lock-label');
    let hideTimeout;

    button.addEventListener('click', () => {
      const isOpen = button.classList.toggle('is-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (label) {
        label.textContent = isOpen ? 'Fechar o cofre' : 'Abrir o cofre';
      }

      if (isOpen) {
        window.clearTimeout(hideTimeout);
        secrets.hidden = false;
        secrets.setAttribute('aria-hidden', 'false');
        secrets.classList.remove('is-visible');
        // Recalcula o layout para reiniciar a animação quando reabrir o cofre.
        void secrets.offsetWidth;
        secrets.classList.add('is-visible');
        markMissionComplete('cofre', 10);
      } else {
        secrets.classList.remove('is-visible');
        secrets.setAttribute('aria-hidden', 'true');
        hideTimeout = window.setTimeout(() => {
          secrets.hidden = true;
        }, 220);
      }
    });
  };

  const toBinary = (text) =>
    Array.from(text).map((char) => {
      const code = char.codePointAt(0) ?? 0;
      const width = code > 0xff ? 16 : 8;
      return code.toString(2).padStart(width, '0');
    });

  const initCipher = () => {
    const form = document.getElementById('cipherForm');
    const output = document.getElementById('encryptedOutput');
    const input = document.getElementById('messageInput');
    if (!form || !output || !input) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        output.textContent = 'Digite uma mensagem secreta para gerar o código.';
        return;
      }
      const result = toBinary(value).join(' ');
      output.textContent = result;
      markMissionComplete('linguagem', 10);
    });
  };

  const initEndToEnd = () => {
    const illustration = document.getElementById('endToEndIllustration');
    if (!illustration) return;

    markMissionComplete('ponta', 12);
  };

  const initHttps = () => {
    markMissionComplete('https', 8);
  };

  const initVpn = () => {
    const illustration = document.getElementById('vpnIllustration');
    const description = document.getElementById('vpnDescription');
    const controls = document.querySelectorAll('.vpn-controls [data-mode]');
    if (!illustration || !description || controls.length === 0) {
      markMissionComplete('vpn', 8);
      return;
    }

    const messages = {
      open: 'Sem VPN: os dados ficam expostos na rede. Qualquer curioso pode espiar o que passa pelo Wi-Fi público.',
      secure: 'Com VPN: seu tráfego passa dentro do túnel cifrado. Os curiosos do Wi-Fi só veem números embaralhados.',
    };

    const applyMode = (mode) => {
      illustration.dataset.state = mode;
      controls.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.mode === mode);
      });
      description.textContent = messages[mode] || '';
      if (mode === 'secure') {
        markMissionComplete('vpn', 10);
      }
    };

    controls.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.mode) {
          applyMode(button.dataset.mode);
        }
      });
    });

    applyMode(illustration.dataset.state || 'secure');
  };

  const initGuardian = () => {
    const button = document.getElementById('guardianButton');
    const card = document.getElementById('guardianCard');
    const message = document.getElementById('guardianMessage');
    const status = document.getElementById('guardianStatus');
    const tips = document.getElementById('guardianTips');
    if (!button || !card || !message || !status) return;

    button.addEventListener('click', () => {
      card.classList.add('is-awake');
      status.textContent = 'Em patrulha';
      message.textContent = 'Guardião ativo: monitorando apps, redes e acessos físicos.';
      if (tips) {
        tips.hidden = false;
      }
      markMissionComplete('guardiao', 8);
    });
  };

  const initCertificate = () => {
    const button = document.getElementById('generateCertificate');
    const card = document.getElementById('certificateCard');
    const message = document.getElementById('certificateMessage');
    if (!button || !card || !message) return;

    button.addEventListener('click', () => {
      card.classList.add('is-earned');
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(now);
      message.textContent = `Emitido em ${formatted}. Continue protegendo seus segredos digitais!`;
      markMissionComplete('certificado', 8);
    });
  };

  const initQuiz = () => {
    const form = document.getElementById('quizForm');
    const result = document.getElementById('quizResult');
    const extraLevel = document.getElementById('extraLevel');
    if (!form || !result) return;

    const answers = { q1: 'b', q2: 'a', q3: 'b' };
    const totalQuestions = Object.keys(answers).length;

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      let answered = 0;
      let score = 0;

      Object.entries(answers).forEach(([question, correct]) => {
        const checked = form.querySelector(`input[name="${question}"]:checked`);
        if (checked) {
          answered += 1;
          if (checked.value === correct) {
            score += 1;
          }
        }
      });

      if (answered < totalQuestions) {
        result.textContent = 'Responda todas as perguntas para ver sua pontuação.';
        if (extraLevel) extraLevel.hidden = true;
        return;
      }

      result.textContent = `Você acertou ${score} de ${totalQuestions} perguntas.`;
      markMissionComplete('quiz', 12);

      if (score === totalQuestions) {
        if (extraLevel) {
          extraLevel.hidden = false;
        }
        if (state.quizHighscore < totalQuestions) {
          state.quizHighscore = totalQuestions;
          grantBonusPoints(10);
        }
      } else {
        if (extraLevel) {
          extraLevel.hidden = true;
        }
        if (state.quizHighscore < score) {
          state.quizHighscore = score;
          persistState();
        } else {
          persistState();
        }
      }
    });
  };

  const initSnowden = () => {
    markMissionComplete('snowden', 4);
  };

  const initPage = () => {
    const pageId = getPageId();
    switch (pageId) {
      case 'home':
        initHome();
        break;
      case 'cofre':
        initCofre();
        break;
      case 'linguagem':
        initCipher();
        break;
      case 'ponta':
        initEndToEnd();
        break;
      case 'https':
        initHttps();
        break;
      case 'vpn':
        initVpn();
        break;
      case 'guardiao':
        initGuardian();
        break;
      case 'certificado':
        initCertificate();
        break;
      case 'quiz':
        initQuiz();
        break;
      case 'snowden':
        initSnowden();
        break;
      default:
        break;
    }
  };

  const init = () => {
    highlightNavigation();
    setupThemeToggle();
    setupRestartButton();
    updatePointsDisplay();
    updateMissionBadges();
    initPage();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  SegredosDigitais.init();
});
