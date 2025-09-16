const SegredosDigitais = (() => {
  const sections = Array.from(document.querySelectorAll('section[data-section]'));
  const progressBar = document.getElementById('progressBar');
  const pointsValue = document.getElementById('pointsValue');
  const themeToggle = document.getElementById('themeToggle');
  const missionAccess = document.getElementById('missionAccess');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const completions = new Set();
  const missionChipMap = new Map();

  let points = 0;
  let highestSectionReached = 0;

  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  const updateProgress = () => {
    const totalSections = Math.max(sections.length - 1, 1);
    const percent = Math.min((highestSectionReached / totalSections) * 100, 100);
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent.toFixed(0));
  };

  const updatePoints = () => {
    pointsValue.textContent = points.toString();
  };

  const addPoints = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return;
    points = Math.max(0, points + value);
    updatePoints();
  };

  const revealMissionAccess = () => {
    if (!missionAccess) return;

    if (missionAccess.hidden) {
      missionAccess.hidden = false;
    }

    requestAnimationFrame(() => {
      missionAccess.classList.add('is-visible');
    });
  };

  const resetMissionAccess = () => {
    if (!missionAccess) return;
    missionAccess.classList.remove('is-visible');
    missionAccess.hidden = true;
  };

  const markCompleted = (key, reward = 0) => {
    if (!completions.has(key)) {
      completions.add(key);
      if (reward) {
        addPoints(reward);
      }
    }
  };

  const highlightMission = (sectionId) => {
    missionChipMap.forEach((button, id) => {
      button.classList.toggle('is-active', id === sectionId);
    });
  };

  const scrollToSection = (id) => {
    const targetIndex = sections.findIndex((section) => section.id === id);
    if (targetIndex === -1) return;

    highestSectionReached = Math.max(highestSectionReached, targetIndex);
    updateProgress();
    highlightMission(id);

    const targetSection = sections[targetIndex];
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }
  };

  const setupMissionNavigation = () => {
    document.querySelectorAll('[data-target]').forEach((button) => {
      const target = button.dataset.target;
      if (!target) return;

      if (button.classList.contains('mission-chip')) {
        missionChipMap.set(target, button);
      }

      button.addEventListener('click', () => {
        scrollToSection(target);
      });
    });
  };

  const setupObserver = () => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId = entry.target.id;
              const index = sections.indexOf(entry.target);
              if (index !== -1) {
                highestSectionReached = Math.max(highestSectionReached, index);
                updateProgress();
                highlightMission(sectionId);
                if (index > 0) {
                  revealMissionAccess();
                }
              }
            }
          });
        },
        { threshold: 0.6 }
      );

      sections.forEach((section) => observer.observe(section));
    } else {
      window.addEventListener('scroll', () => {
        const midpoint = window.scrollY + window.innerHeight / 2;
        for (let i = sections.length - 1; i >= 0; i -= 1) {
          const section = sections[i];
          if (midpoint >= section.offsetTop) {
            highestSectionReached = Math.max(highestSectionReached, i);
            updateProgress();
            highlightMission(section.id);
            if (i > 0) {
              revealMissionAccess();
            }
            break;
          }
        }
      });
    }
  };

  const setupThemeToggle = () => {
    const storedTheme = localStorage.getItem('sd-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (theme) => {
      const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
      document.body.dataset.theme = normalizedTheme;
      themeToggle.setAttribute(
        'aria-label',
        normalizedTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
      );
    };

    if (storedTheme) {
      applyTheme(storedTheme);
    } else if (systemPrefersDark.matches) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }

    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('sd-theme', nextTheme);
    });
  };

  const setupCofre = () => {
    const trigger = document.getElementById('cofreTrigger');
    const lockShape = document.getElementById('cofreLockShape');
    const secrets = document.getElementById('cofreSecrets');

    if (!trigger || !lockShape || !secrets) return;

    trigger.addEventListener('click', () => {
      const wasCompleted = completions.has('cofre');
      lockShape.classList.add('unlocked');
      secrets.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');

      if (!wasCompleted) {
        markCompleted('cofre', 25);
        setTimeout(() => scrollToSection('linguagem'), 700);
      }
    });
  };

  const setupCipher = () => {
    const input = document.getElementById('messageInput');
    const button = document.getElementById('encryptButton');
    const output = document.getElementById('encryptedOutput');

    if (!input || !button || !output) return;

    const transformMessage = () => {
      const message = input.value.trim();
      if (!message) {
        output.textContent = 'Digite uma mensagem para ver a mágica acontecer!';
        output.classList.remove('success');
        return;
      }

      const converted = Array.from(message.normalize('NFC'))
        .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ');

      output.textContent = converted;
      output.classList.add('success');

      const wasCompleted = completions.has('cipher');
      markCompleted('cipher', 30);
      if (!wasCompleted) {
        setTimeout(() => scrollToSection('assimetrica'), 700);
      }
    };

    button.addEventListener('click', transformMessage);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        transformMessage();
      }
    });
  };

  const setupAsymmetricDemo = () => {
    const button = document.getElementById('asymmetryTrigger');
    const demo = document.querySelector('.asymmetric-demo');

    if (!button || !demo) return;

    const runDemo = () => {
      demo.classList.remove('active');
      // force reflow to restart animation
      void demo.offsetWidth;
      demo.classList.add('active');

      const wasCompleted = completions.has('asymmetric');
      markCompleted('asymmetric', 20);
      if (!wasCompleted) {
        setTimeout(() => scrollToSection('https'), 900);
      }

      setTimeout(() => demo.classList.remove('active'), 4000);
    };

    button.addEventListener('click', runDemo);
  };

  const setupProtocolComparison = () => {
    const button = document.getElementById('protocolToggle');
    const grid = document.querySelector('.protocol-grid');

    if (!button || !grid) return;

    const updateLabel = () => {
      const secure = grid.classList.contains('secure');
      button.textContent = secure ? '🔁 Mostrar HTTP vulnerável' : '🔒 Ver proteção HTTPS';
      button.setAttribute('aria-pressed', secure ? 'true' : 'false');
    };

    button.addEventListener('click', () => {
      const wasCompleted = completions.has('https');
      grid.classList.toggle('secure');
      updateLabel();

      if (!wasCompleted) {
        markCompleted('https', 20);
        setTimeout(() => scrollToSection('vpn'), 800);
      }
    });

    updateLabel();
  };

  const setupVpnDemo = () => {
    const button = document.getElementById('vpnTrigger');
    const tunnel = document.querySelector('.vpn-tunnel');

    if (!button || !tunnel) return;

    const runTunnel = () => {
      tunnel.classList.remove('active');
      void tunnel.offsetWidth;
      tunnel.classList.add('active');

      const wasCompleted = completions.has('vpn');
      markCompleted('vpn', 20);
      if (!wasCompleted) {
        setTimeout(() => scrollToSection('guardiao'), 850);
      }

      setTimeout(() => tunnel.classList.remove('active'), 3200);
    };

    button.addEventListener('click', runTunnel);
  };

  const setupGuardian = () => {
    const button = document.getElementById('guardianButton');
    const details = document.getElementById('guardianDetails');

    if (!button || !details) return;

    button.addEventListener('click', () => {
      const isHidden = details.hasAttribute('hidden');
      if (isHidden) {
        details.removeAttribute('hidden');
      } else {
        details.setAttribute('hidden', '');
      }
      button.setAttribute('aria-expanded', String(isHidden));

      if (isHidden) {
        const wasCompleted = completions.has('guardian');
        markCompleted('guardian', 25);
        if (!wasCompleted) {
          setTimeout(() => scrollToSection('certificado'), 900);
        }
      }
    });
  };

  const setupShare = () => {
    const shareButton = document.getElementById('shareButton');
    if (!shareButton) return;

    shareButton.addEventListener('click', async () => {
      markCompleted('share', 10);
      const shareData = {
        title: 'Segredos Digitais',
        text: 'Acabei de completar a jornada Segredos Digitais e aprendi muito sobre criptografia! 🔐',
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          // User might cancel; no action needed
        }
      } else {
        alert('Compartilhe a novidade: quanto mais gente protege seus dados, mais seguro fica o mundo digital!');
      }
    });
  };

  const setupSnowdenDialog = () => {
    const dialog = document.getElementById('snowdenDialog');
    const openButton = document.getElementById('snowdenOpen');
    if (!dialog || !openButton) return;

    const closeDialog = () => {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    };

    openButton.addEventListener('click', () => {
      markCompleted('snowden', 15);
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', 'true');
      }
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        closeDialog();
      }
    });

    dialog.querySelectorAll('[data-close]').forEach((button) => {
      button.addEventListener('click', closeDialog);
    });
  };

  const setupQuiz = () => {
    const quizForm = document.getElementById('quizForm');
    const quizResult = document.getElementById('quizResult');
    const levelExtra = document.getElementById('levelExtra');

    if (!quizForm || !quizResult || !levelExtra) return;

    const answers = {
      q1: 'a',
      q2: 'c',
      q3: 'c'
    };

    quizForm.addEventListener('submit', (event) => {
      event.preventDefault();

      let score = 0;
      Object.entries(answers).forEach(([name, value]) => {
        const field = quizForm.elements.namedItem(name);
        if (!field) return;
        const selected = quizForm.querySelector(`input[name="${name}"]:checked`);
        if (selected && selected.value === value) {
          score += 1;
        }
      });

      quizResult.classList.remove('success', 'warning', 'error');
      if (score === 3) {
        quizResult.textContent = '🔥 Você acertou 3 de 3! HTTPS, VPN e criptografia estão no sangue!';
        quizResult.classList.add('success');
        levelExtra.classList.add('show');
        markCompleted('quizPerfect', 20);
      } else if (score === 2) {
        quizResult.textContent = '👏 Mandou bem! Você acertou 2 de 3 e falta pouco para virar agente nível máximo.';
        quizResult.classList.add('warning');
        levelExtra.classList.remove('show');
      } else {
        quizResult.textContent = `📚 Você acertou ${score} de 3. Que tal revisar as missões e tentar de novo?`;
        quizResult.classList.add('error');
        levelExtra.classList.remove('show');
      }

      if (!completions.has('quiz')) {
        markCompleted('quiz', score * 10);
      }
    });
  };

  const setupRestart = () => {
    const restartButton = document.getElementById('restartButton');
    if (!restartButton) return;

    restartButton.addEventListener('click', () => {
      points = 0;
      highestSectionReached = 0;
      completions.clear();
      updatePoints();
      updateProgress();

      const lockShape = document.getElementById('cofreLockShape');
      const secrets = document.getElementById('cofreSecrets');
      const trigger = document.getElementById('cofreTrigger');
      if (lockShape) lockShape.classList.remove('unlocked');
      if (secrets) secrets.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');

      const input = document.getElementById('messageInput');
      const output = document.getElementById('encryptedOutput');
      if (input) input.value = '';
      if (output) {
        output.textContent = '';
        output.classList.remove('success');
      }

      const demo = document.querySelector('.asymmetric-demo');
      if (demo) demo.classList.remove('active');

      const grid = document.querySelector('.protocol-grid');
      const protocolButton = document.getElementById('protocolToggle');
      if (grid) grid.classList.remove('secure');
      if (protocolButton) {
        protocolButton.textContent = '🔒 Ver proteção HTTPS';
        protocolButton.setAttribute('aria-pressed', 'false');
      }

      const tunnel = document.querySelector('.vpn-tunnel');
      if (tunnel) tunnel.classList.remove('active');

      const guardianDetails = document.getElementById('guardianDetails');
      const guardianButton = document.getElementById('guardianButton');
      if (guardianDetails) guardianDetails.setAttribute('hidden', '');
      if (guardianButton) guardianButton.setAttribute('aria-expanded', 'false');

      const quizForm = document.getElementById('quizForm');
      const quizResult = document.getElementById('quizResult');
      const levelExtra = document.getElementById('levelExtra');
      if (quizForm) quizForm.reset();
      if (quizResult) {
        quizResult.textContent = '';
        quizResult.classList.remove('success', 'warning', 'error');
      }
      if (levelExtra) levelExtra.classList.remove('show');

      resetMissionAccess();
      highlightMission('hero');
      scrollToSection('hero');
    });
  };

  const init = () => {
    setupMissionNavigation();
    setupObserver();
    setupThemeToggle();
    setupCofre();
    setupCipher();
    setupAsymmetricDemo();
    setupProtocolComparison();
    setupVpnDemo();
    setupGuardian();
    setupShare();
    setupSnowdenDialog();
    setupQuiz();
    setupRestart();

    updatePoints();
    updateProgress();
    resetMissionAccess();
    highlightMission('hero');

    const startButton = document.getElementById('startJourney');
    if (startButton) {
      startButton.addEventListener('click', () => {
        markCompleted('start', 10);
        revealMissionAccess();
        scrollToSection('cofre');
      });
    }
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  SegredosDigitais.init();
});
