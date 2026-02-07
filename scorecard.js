// Scorecard Logic

// Questions Data
const questions = [
    // PHASE 1 — IDENTITY
    {
        question: "How do you currently see yourself as a Salesforce candidate?",
        options: [
            { text: "Very confident — I should already be hired", score: 10 },
            { text: "Decent — just need more interviews", score: 5 },
            { text: "Unsure — something feels off", score: 0 }
        ]
    },
    {
        question: "How long have you been preparing for Salesforce roles?",
        options: [
            { text: "Less than 3 months", score: 10 },
            { text: "3–6 months", score: 5 },
            { text: "6+ months", score: 0 }
        ]
    },
    {
        question: "What frustrates you MOST right now?",
        options: [
            { text: "Not getting interview calls", score: 5 },
            { text: "Getting calls but failing rounds", score: 0 },
            { text: "Rejections without clear feedback", score: 0 }
        ]
    },

    // PHASE 2 — REALITY CHECK
    {
        question: "Can you explain your last Salesforce project without memorizing lines?",
        options: [
            { text: "Yes, naturally", score: 10 },
            { text: "Somewhat", score: 5 },
            { text: "No, I struggle", score: 0 }
        ]
    },
    {
        question: "If an interviewer asks “Walk me through your automation,” what happens?",
        options: [
            { text: "I explain clearly step-by-step", score: 10 },
            { text: "I jump between points", score: 5 },
            { text: "I get confused", score: 0 }
        ]
    },
    {
        question: "How strong is your resume storytelling?",
        options: [
            { text: "Every project has a clear story", score: 10 },
            { text: "Some projects are weak", score: 5 },
            { text: "I just listed technologies", score: 0 }
        ]
    },

    // PHASE 3 — PRESSURE RESPONSE
    {
        question: "When you don’t know an answer in interviews, what do you do?",
        options: [
            { text: "Think aloud and reason", score: 10 },
            { text: "Freeze internally", score: 0 },
            { text: "Guess randomly", score: 0 }
        ]
    },
    {
        question: "How do you handle follow-up questions?",
        options: [
            { text: "Calmly clarify", score: 10 },
            { text: "Start rambling", score: 5 },
            { text: "Lose confidence", score: 0 }
        ]
    },
    {
        question: "Have you ever walked out of an interview knowing you messed up?",
        options: [
            { text: "Never", score: 10 },
            { text: "Once or twice", score: 5 },
            { text: "Many times", score: 0 }
        ]
    },

    // PHASE 4 — SELF-AWARENESS
    {
        question: "Do you clearly understand why you failed your last interview?",
        options: [
            { text: "Yes — specific reasons", score: 10 },
            { text: "Vaguely", score: 5 },
            { text: "No idea", score: 0 }
        ]
    },
    {
        question: "Have you ever received structured feedback on your interview performance?",
        options: [
            { text: "Yes, multiple times", score: 10 },
            { text: "Once", score: 5 },
            { text: "Never", score: 0 }
        ]
    },
    {
        question: "Have you done realistic mock interviews with pressure + feedback?",
        options: [
            { text: "Regularly", score: 10 },
            { text: "Tried once", score: 5 },
            { text: "Never", score: 0 }
        ]
    },

    // PHASE 5 — CONSEQUENCE
    {
        question: "How many interviews do you think you’ve already wasted?",
        options: [
            { text: "0–2", score: 10 },
            { text: "3–5", score: 5 },
            { text: "5+", score: 0 }
        ]
    },
    {
        question: "If nothing changes, where will you be in 3 months?",
        options: [
            { text: "Hopefully hired (no plan)", score: 10 }, // Slightly better mindset? Or maybe 0 logic. Keeping 10 as per 'best' relative option or neutral.
            { text: "Still applying", score: 5 },
            { text: "Still failing rounds", score: 0 }
        ]
    },
    {
        question: "Be honest: do you have a SYSTEM for cracking interviews?",
        options: [
            { text: "Yes", score: 10 },
            { text: "Sort of", score: 5 },
            { text: "No", score: 0 }
        ]
    }
];

// State
let currentQuestionIndex = 0;
let totalScore = 0;
const maxScore = 150; // 15 questions * 10 max points

// DOM Elements
const heroSection = document.getElementById('quiz-hero');
const quizInterface = document.getElementById('quiz-interface');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const questionCard = document.getElementById('question-card');
const progressFill = document.getElementById('progress-fill');
const currentQSpan = document.getElementById('q-current');
const totalQSpan = document.getElementById('q-total');

// Canvas Particles (Reused from main.js logic for consistency)
// Simple check if particles container exists
if (document.getElementById('particles-js')) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    document.getElementById('particles-js').appendChild(canvas);

    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.color = `rgba(0, 242, 234, ${Math.random() * 0.5})`;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        resize();
        particles = [];
        for (let i = 0; i < 60; i++) particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', resize);
    initParticles();
    animateParticles();
}

// Cursor Logic (Reused)
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
window.addEventListener('mousemove', (e) => {
    cursorDot.style.left = `${e.clientX}px`;
    cursorDot.style.top = `${e.clientY}px`;
    cursorOutline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 500, fill: "forwards" });
});

// Magnetic Buttons (Reused)
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        });
    });
}
initMagneticButtons();

// --- APP FLOW ---

// Start Quiz
startBtn.addEventListener('click', () => {
    gsap.to(heroSection, {
        opacity: 0, y: -50, duration: 0.5, onComplete: () => {
            heroSection.classList.add('hidden');
            quizInterface.classList.remove('hidden');
            gsap.from(quizInterface, { opacity: 0, y: 50, duration: 0.5 });
            loadQuestion(0);
        }
    });
});

function loadQuestion(index) {
    const qData = questions[index];

    // Update Progress
    const progress = ((index) / questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    currentQSpan.textContent = index + 1;
    totalQSpan.textContent = questions.length;

    // Animate Card Out (if not first)
    // Populate Card
    questionCard.innerHTML = `
        <h2 class="question-text">${qData.question}</h2>
        <div class="options-grid">
            ${qData.options.map((opt, i) => `
                <button class="option-btn" data-score="${opt.score}" style="animation-delay: ${i * 0.1}s">
                    ${opt.text}
                    <span class="arrow">→</span>
                </button>
            `).join('')}
        </div>
    `;

    // Animation In
    gsap.fromTo(questionCard,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
    );

    gsap.fromTo('.option-btn',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.3, delay: 0.2 }
    );

    // Bind Events
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', handleAnswer);
    });
}

function handleAnswer(e) {
    const btn = e.currentTarget;
    const score = parseInt(btn.getAttribute('data-score'));

    // Visual Selection
    btn.classList.add('selected');

    // Add Score
    totalScore += score;

    // Delay for transition
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            showResults();
        }
    }, 400);
}

function showResults() {
    quizInterface.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    // Calculate Outcome
    const percentage = Math.round((totalScore / maxScore) * 100);
    let outcome = {};

    if (percentage <= 40) {
        outcome = {
            class: 'outcome-red',
            title: "You’re Burning Opportunities",
            message: "You don’t lack knowledge. You lack interview execution. Right now you’re attending interviews without structured answers, pressure handling, or feedback loops. This is why offers aren’t coming.",
            ctaText: "Fix My Interview Strategy" // 0-40
        };
    } else if (percentage <= 70) {
        outcome = {
            class: 'outcome-yellow',
            title: "You’re Almost There — But Making Costly Mistakes",
            message: "You have skills. But poor structure, nervous responses, and unclear storytelling are blocking offers. These are fixable — quickly.",
            ctaText: "Book Free Strategy Call" // 41-70
        };
    } else {
        outcome = {
            class: 'outcome-green',
            title: "You Should Be Getting Offers",
            message: "Your fundamentals are strong. But small execution gaps are stopping conversion. Let’s remove them.",
            ctaText: "Optimize My Interview Performance" // 71-100
        };
    }

    // Update DOM
    const resultCard = document.querySelector('.result-card');
    resultCard.classList.add(outcome.class);

    document.getElementById('final-score').textContent = percentage;
    document.getElementById('result-title').textContent = outcome.title;
    document.getElementById('result-message').textContent = outcome.message;
    document.getElementById('result-cta').innerHTML = `
        <a href="#cta" class="btn-primary magnetic">${outcome.ctaText}</a>
    `;

    initMagneticButtons(); // Re-init for new button

    // Animate Result
    gsap.from(resultScreen, { opacity: 0, duration: 1 });

    // Circle Animation
    setTimeout(() => {
        const circle = document.getElementById('score-stroke');
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }, 500);

    // Count Up
    const scoreNum = document.getElementById('final-score');
    gsap.to(scoreNum, {
        innerHTML: percentage,
        duration: 2,
        snap: { innerHTML: 1 }
    });
}
