// Custom Cursor
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Canvas Particles for Hero
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
        this.color = `rgba(${Math.random() > 0.5 ? '0, 242, 234' : '0, 188, 212'}, ${Math.random() * 0.5})`;
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
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', resize);
initParticles();
animateParticles();

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Hero Animation
const heroTimeline = gsap.timeline();

heroTimeline.from('.hero-title .reveal-text', {
    y: 100,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power4.out"
})
    .from('.hero-subtext', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.5")
    .from('.hero-cta a', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: "power2.out"
    }, "-=0.3");

// Problem Section - Staggered Reveal
gsap.from('.problem-item', {
    scrollTrigger: {
        trigger: '.problem-grid',
        start: 'top 80%',
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out"
});

// Floating Cards Animation
gsap.utils.toArray('.float-card').forEach((card, i) => {
    gsap.to(card, {
        y: -15, // Floating distance
        duration: 2 + i * 0.2, // Variation in speed
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
    });

    // Scroll reveal for cards
    gsap.from(card, {
        scrollTrigger: {
            trigger: '.cards-container',
            start: 'top 85%',
        },
        y: 100,
        opacity: 0,
        duration: 1,
        delay: i * 0.1,
        ease: "power4.out"
    });
});

// Process Timeline Animation
// Drawing the line
// (CSS variable manipulation or height animation can be added here)
const steps = gsap.utils.toArray('.timeline-step');
steps.forEach((step, i) => {
    gsap.from(step, {
        scrollTrigger: {
            trigger: step,
            start: 'top 85%',
        },
        x: i % 2 === 0 ? 50 : -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });
});

// Animated Counters
const metrics = document.querySelectorAll('.metric-number');

metrics.forEach(metric => {
    const target = +metric.getAttribute('data-target');

    ScrollTrigger.create({
        trigger: metric,
        start: 'top 85%',
        once: true,
        onEnter: () => {
            gsap.to(metric, {
                innerHTML: target,
                duration: 2,
                snap: { innerHTML: 1 },
                ease: "power2.out"
            });
        }
    });
});

// Magnetic Buttons (Optional simple implementation)
const magneticBtns = document.querySelectorAll('.magnetic');

magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
            ease: "power2.out"
        });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)"
        });
    });
});
