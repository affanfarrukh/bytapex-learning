/**
 * Sound Effects Manager using synthesized Web Audio API
 * Replaces Howler.js for zero-dependency instant sounds.
 */

let audioCtx = null;
let activeInteraction = false;

// Initialize on first definitive gesture
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }
}

['click', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => {
        activeInteraction = true;
        initAudio();
    }, { once: true });
});

function playSound(type) {
    // Prevent any audio creation or playback before user clicks/interacts
    if (!activeInteraction || !audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
        if (type === 'hover') return;
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click' || type === 'drag') {
        // Short "pop"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'hover') {
        // Very subtle "tick"
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'success') {
        // Nice "Chime"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        // Add a second harmonic for richness
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(800, now);
        osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
        osc2.start(now);
        osc2.stop(now + 0.5);
    }
}
window.playSound = playSound;

// Global event listeners for UI interactions
document.addEventListener('DOMContentLoaded', () => {
    function refreshCursorListeners() {
        // Add hover sounds to interactive elements
        document.querySelectorAll('a, button, input, textarea, .custom-checkbox, .btn-add, .day-circle, .kanban-card, .glass-card, .checkbox-row').forEach(el => {
            el.addEventListener('mouseenter', () => {
                playSound('hover');
            });
        });
    }

    refreshCursorListeners();
    window.refreshCursorListeners = refreshCursorListeners;

    document.addEventListener('click', (e) => {
        if (e.target.closest('button, .custom-checkbox, .day-circle, .close-modal, .checkbox-row')) {
            if (e.target.id !== 'login-btn') {
                playSound('click');
            }
        }
    });
});
