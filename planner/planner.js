/**
 * bytapex Career Planner - Main Application Logic
 * Handles Authentication, State Management, UI Updates, and Google Sheets Sync.
 */

// CONFIGURATION
const API_URL = "https://script.google.com/macros/s/AKfycbzKjMlJnpR16S2tbrsFhWcKnNZDxRz-dBqoUKwRStmt8qOUKfDyAsQTSF6ey6AaTGyZ/exec"; // User must replace this

// STATE
let currentUser = null;
let appState = {
    dailyRoutine: {},
    visibilityHistory: [], // stored as { date: 'YYYY-MM-DD', score: 0 }
    interviewReadiness: { tech: 30, comm: 30, exec: 30 }, // Starting baseline
    jobPipeline: {
        applied: [],
        screen: [],
        tech: [],
        final: [],
        offer: [],
        lost: []
    },
    metrics: {
        appsSent: 0,
        interviews: 0,
        mocks: 0,
        conceptsRevised: 0,
        questionsSolved: 0,
        consistencyDays: 0
    }
};

// DOM ELEMENTS
const authOverlay = document.getElementById('auth-overlay');
const loginBtn = document.getElementById('login-btn');
const userEmailInput = document.getElementById('user-email');
const cursorDot = document.querySelector('.cursor-dot');
const daysContainer = document.getElementById('days-container');

// DAY TRACKING
let currentDay = new Date().toISOString().split('T')[0];

// CALENDAR TRACKING
let viewedWeekDate = new Date();

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Initializing Planner...");
        initParticles();
        initCursor();
        initDatePicker();
        initAnimations();
        initCharts(); // From charts.js
        checkAuth();
    } catch (error) {
        console.error("Initialization Error:", error);
        alert("An error occurred while loading the application. Check console for details.");
    }
});

// MODAL CONTROL
function openModal() {
    const modal = document.getElementById('reality-check-modal');
    modal.classList.add('modal-active');
}

function closeModal() {
    const modal = document.getElementById('reality-check-modal');
    modal.classList.remove('modal-active');
}

// PARTICLES AND CURSOR
function initParticles() {
    const container = document.getElementById('particles-container');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    // Random properties
    const size = Math.random() * 100 + 50;
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight + window.innerHeight;
    const duration = Math.random() * 20 + 15;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    container.appendChild(particle);

    gsap.to(particle, {
        y: -window.innerHeight * 2,
        x: `+=${Math.random() * 200 - 100}`,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.3,
        duration: duration,
        ease: "none",
        repeat: -1,
        delay: -Math.random() * duration
    });
}

function initCursor() {
    document.addEventListener('mousemove', (e) => {
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top = e.clientY + 'px';
    });

    // Make interactive elements trigger cursor expansion
    document.querySelectorAll('a, button, input, textarea, .custom-checkbox, .day-circle, .kanban-card, .glass-card, .checkbox-row').forEach(el => {
        el.addEventListener('mouseenter', () => cursorDot.classList.add('active'));
        el.addEventListener('mouseleave', () => cursorDot.classList.remove('active'));
    });
}

// CONSISTENCY DAYS
function initDatePicker() {
    const dateInput = document.getElementById('planner-date');
    if (dateInput) {
        // Set to today
        dateInput.value = currentDay;

        // Listen for changes
        dateInput.addEventListener('change', (e) => {
            if (e.target.value) {
                switchDate(e.target.value);
            }
        });
    }
}

function switchDate(dateString) {
    if (dateString === currentDay) return;

    playSound('click');

    // Update local state and input value just in case
    currentDay = dateString;
    const dateInput = document.getElementById('planner-date');
    if (dateInput && dateInput.value !== dateString) {
        dateInput.value = dateString;
    }

    // Animate the planner change
    gsap.from("#planner", {
        y: 20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
    });

    // Re-render the routine based on the newly selected day
    renderRoutine();
}


// AUTHENTICATION
// AUTHENTICATION
function checkAuth() {
    // Pure backend mode: No local storage check.
    // User must always log in to ensure fresh session.
    console.log("Waiting for user login...");
    authOverlay.style.display = 'flex';
    gsap.set(authOverlay, { opacity: 1 });
}

loginBtn.addEventListener('click', () => {
    const email = userEmailInput.value.trim();
    if (email && email.includes('@')) {
        loginUser(email);
    } else {
        alert("Please enter a valid email.");
    }
});

function loginUser(email) {
    currentUser = email;
    // Removed: localStorage.setItem('bytapex_user_email', email);

    // Hide Overlay with Animation
    gsap.to(authOverlay, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            authOverlay.style.display = 'none';
            document.getElementById('loading-overlay').style.display = 'flex';

            // Important: index.html has classes 'main-container blur-content container'
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.classList.remove('blur-content');
            }

            // Load Data - let the fetch logic handle the final reveal
            fetchUserData();
        }
    });
}

// DATA FETCHING
async function fetchUserData() {
    try {
        // Show loading state if needed, or just wait
        console.log("Fetching data from backend...");

        const response = await fetch(`${API_URL}?email=${currentUser}`);
        const data = await response.json();

        if (data.status === 'success') {
            // Safely merge old saves with new schema properties
            const defaultState = {
                dailyRoutine: {},
                visibilityHistory: [],
                interviewReadiness: { tech: 30, comm: 30, exec: 30 },
                jobPipeline: { applied: [], screen: [], tech: [], final: [], offer: [], lost: [] },
                metrics: { appsSent: 0, interviews: 0, mocks: 0, conceptsRevised: 0, questionsSolved: 0, consistencyDays: 0 },
                scheduledInterviews: []
            };

            // Shallow merge the exact state
            appState = { ...defaultState, ...(data.payload || {}) };

            // Ensure nested objects aren't null if they were partially saved
            if (!appState.jobPipeline) appState.jobPipeline = defaultState.jobPipeline;
            if (!appState.metrics) appState.metrics = defaultState.metrics;
            if (!appState.dailyRoutine) appState.dailyRoutine = defaultState.dailyRoutine;
            if (!appState.scheduledInterviews) appState.scheduledInterviews = [];

            // MIGRATE: Convert old string cards to rich objects
            const stages = ['applied', 'screen', 'tech', 'final', 'offer', 'lost'];
            stages.forEach(stage => {
                if (appState.jobPipeline[stage]) {
                    appState.jobPipeline[stage] = appState.jobPipeline[stage].map(card => {
                        if (typeof card === 'string') {
                            // Turn legacy string into new object format
                            return {
                                id: 'card-' + Date.now() + Math.floor(Math.random() * 1000),
                                company: card,
                                description: '',
                                date: new Date().toISOString().split('T')[0],
                                salary: '',
                                stage: stage
                            };
                        }
                        return card;
                    });
                }
            });

            renderUI();
        } else if (data.status === 'not_found' || !data.payload) {
            // New user or empty profile -> create defaults on backend
            console.log("New user detected. Creating profile...");
            saveUserData(); // This will initialize the DB with current appState (defaults)
            renderUI();     // Render defaults
        } else {
            console.error("Backend returned error:", data.message);
            alert("Could not load data. Please try again.");
        }
    } catch (e) {
        console.error("Fetch error:", e);
        alert("Network error. Unable to connect to Google Sheets backend.");
    } finally {
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            gsap.to(loadingOverlay, {
                opacity: 0,
                duration: 0.4,
                onComplete: () => {
                    loadingOverlay.style.display = 'none';

                    // Reveal dashboard smoothly
                    gsap.to(".fade-in", {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: "power3.out"
                    });

                    playSound('success');
                    checkPersonalInfoComplete();
                }
            });
        }
    }
}

// DEBOUNCE UTILITY
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// SAVING DATA
const saveUserData = debounce(async () => {
    if (!currentUser) return;

    console.log("Saving data to backend...");

    try {
        // We use text/plain to avoid CORS preflight (OPTIONS) requests which GAS doesn't handle.
        // We do NOT use 'no-cors' so that we can actually read the response.
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: "follow", // Important for GAS
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ email: currentUser, data: appState })
        });

        const result = await response.json();

        if (result.status === 'success') {
            console.log("Data saved successfully.");
        } else {
            console.error("Save failed:", result.message);
        }
    } catch (e) {
        console.error("Save error:", e);
    }
}, 250); // 250ms debounce for faster syncing

// UI RENDERING
function renderUI() {
    renderRoutine();
    renderKanban();
    renderMetrics();
    renderMiniCalendar();
    renderInterviews();

    // 1. Calculate and Render Readiness
    const readiness = calculateReadiness();
    updateReadiness(readiness.tech, readiness.comm, readiness.exec);

    // 2. Calculate and Render Visibility
    const visibilityData = getVisibilityDataForChart();
    updateVisibilityChart(visibilityData.scores, visibilityData.labels);
}

// TIMEZONE LOGIC
let currentCalendarTimezone = 'local';

window.updateCalendarTimezone = function (val) {
    currentCalendarTimezone = val;
    renderInterviews();
};

function getZonedDate(timestamp) {
    if (currentCalendarTimezone === 'local') return new Date(timestamp);
    try {
        const d = new Date(timestamp);

        // Format the date parts in the target timezone
        const options = {
            timeZone: currentCalendarTimezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        };

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(d);

        const mapped = {};
        parts.forEach(p => mapped[p.type] = p.value);

        // Create a fake local Date object that holds the shifted values
        // Note: Months are 0-indexed in Date constructor
        return new Date(
            parseInt(mapped.year),
            parseInt(mapped.month) - 1,
            parseInt(mapped.day),
            parseInt(mapped.hour),
            parseInt(mapped.minute),
            parseInt(mapped.second)
        );

    } catch (e) {
        console.error("Timezone conversion error:", e);
        return new Date(timestamp);
    }
}

function getOffsetString(dateObj) {
    if (currentCalendarTimezone === 'local') {
        const offset = -dateObj.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
        const mins = (Math.abs(offset) % 60).toString().padStart(2, '0');
        return `GMT${sign}${hours}:${mins}`;
    }
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: currentCalendarTimezone, timeZoneName: 'shortOffset' }).formatToParts(dateObj);
        const tzName = parts.find(p => p.type === 'timeZoneName');
        if (tzName) return tzName.value;
    } catch (e) { }

    if (currentCalendarTimezone === 'UTC') return 'GMT+00:00';
    return currentCalendarTimezone;
}

// INTERVIEW SCHEDULER RENDERING
function renderInterviews() {
    const headerContainer = document.getElementById('calendar-header');
    const timeColumn = document.getElementById('time-column');
    const gridContainer = document.getElementById('calendar-grid');
    if (!headerContainer || !timeColumn || !gridContainer) return;

    // 1. Gather pipeline interview events dynamically
    let pipelineEvents = [];
    const allStages = ['applied', 'screen', 'tech', 'final', 'offer', 'lost'];
    allStages.forEach(stage => {
        if (appState.jobPipeline[stage]) {
            appState.jobPipeline[stage].forEach(cardObj => {
                if (cardObj.meetingScheduled && cardObj.meetingDate) {
                    pipelineEvents.push({
                        title: cardObj.company,
                        type: cardObj.meetingType || 'Technical',
                        timestamp: new Date(cardObj.meetingDate).getTime(),
                        id: cardObj.id,
                        stage: stage
                    });
                }
            });
        }
    });

    pipelineEvents.sort((a, b) => a.timestamp - b.timestamp);

    // 2. Calculate the currently viewed week (Sunday to Saturday) based on viewedWeekDate
    const currentDayOfWeek = viewedWeekDate.getDay(); // 0 (Sun) to 6 (Sat)
    const sunday = new Date(viewedWeekDate);
    sunday.setDate(viewedWeekDate.getDate() - currentDayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        weekDates.push(d);
    }

    // 3. Render Headers
    const daysStr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const displayOffset = getOffsetString(new Date());
    const tzDisplayEl = document.getElementById('tz-offset-display');
    if (tzDisplayEl) {
        tzDisplayEl.innerText = currentCalendarTimezone === 'local' ? 'Local' : displayOffset;
    }

    let headerHTML = `<div class="time-col-header" style="font-size: 0.7rem; color: var(--text-secondary); display: flex; align-items: flex-end; justify-content: flex-end; padding-bottom: 5px; padding-right: 10px;">${displayOffset}</div>`;

    const today = new Date();
    weekDates.forEach((date, index) => {
        const isToday = date.toDateString() === today.toDateString();
        headerHTML += `
            <div class="day-header ${isToday ? 'today' : ''}">
                <div>${daysStr[index]}</div>
                <div class="date-num">${date.getDate()}</div>
            </div>`;
    });
    headerContainer.innerHTML = headerHTML;

    // 4. Render Time Slots (24 Hours)
    const startHour = 0;
    const endHour = 23; // 11 PM
    const totalHours = endHour - startHour + 1; // 24 hours

    let timeHTML = '';
    for (let h = startHour; h <= endHour; h++) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        timeHTML += `<div class="time-slot">${displayH} ${ampm}</div>`;
    }
    timeColumn.innerHTML = timeHTML;

    // 5. Render Grid Columns & Events
    gridContainer.style.height = `${totalHours * 40}px`;
    gridContainer.innerHTML = '';

    weekDates.forEach((date, colIndex) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'grid-day-col';

        // Filter events for this exact day
        const dayEvents = pipelineEvents.filter(interview => {
            const evDate = getZonedDate(interview.timestamp);
            return evDate.toDateString() === date.toDateString();
        });

        dayEvents.forEach(event => {
            const evDate = getZonedDate(event.timestamp);
            const evHour = evDate.getHours();
            const evMin = evDate.getMinutes();

            // Plot if it falls within sensible bounds
            if (evHour >= startHour - 1 && evHour <= endHour + 1) {
                const hourDiff = evHour - startHour;
                const topPx = (hourDiff * 40) + (evMin / 60 * 40);
                const heightPx = 40; // Assume 1 HR duration default

                const block = document.createElement('div');
                block.className = 'event-block';
                block.style.top = `${topPx}px`;
                block.style.height = `${heightPx}px`;
                block.title = `${event.title} (${event.type}) - Click to edit`;

                block.innerHTML = `
                    <div class="event-title">${event.title}</div>
                `;

                // Clicking the event block opens the specific Kanban ticket modal
                block.onclick = (e) => {
                    e.stopPropagation();
                    openCardDetails(event.id, event.stage);
                    toggleEditCardMode(true);
                };

                colDiv.appendChild(block);
            }
        });

        gridContainer.appendChild(colDiv);
    });

    // 5. Render Current Time Line
    const curHour = today.getHours();
    const curMin = today.getMinutes();
    if (curHour >= startHour && curHour <= endHour + 1) {
        const topPx = ((curHour - startHour) * 40) + (curMin / 60 * 40);
        const redLine = document.createElement('div');
        redLine.className = 'current-time-line';
        redLine.style.top = `${topPx}px`;
        redLine.innerHTML = `<div class="red-dot"></div>`;
        gridContainer.appendChild(redLine);

        // Auto-scroll calendar to current time
        const scrollContainer = document.querySelector('.calendar-body');
        if (scrollContainer) {
            // Scroll so the line is roughly in the middle of the 400px container
            requestAnimationFrame(() => {
                scrollContainer.scrollTop = Math.max(0, topPx - 150);
            });
        }
    }
}

function renderMiniCalendar() {
    const monthYearEl = document.getElementById('mc-month-year');
    const gridEl = document.getElementById('mc-grid');
    if (!monthYearEl || !gridEl) return;

    const year = viewedWeekDate.getFullYear();
    const month = viewedWeekDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearEl.innerText = `${monthNames[month]} ${year}`;

    // Get first day of the month
    const firstDay = new Date(year, month, 1).getDay();
    // Get days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Get days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let gridHTML = '';

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        gridHTML += `<div class="mc-day other-month" onclick="selectMiniDate(${year}, ${month - 1}, ${d})">${d}</div>`;
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const isSelectedWeek = (
            viewedWeekDate.getFullYear() === year &&
            viewedWeekDate.getMonth() === month &&
            viewedWeekDate.getDate() === i
        );
        const isActive = isSelectedWeek ? 'active' : '';
        gridHTML += `<div class="mc-day ${isActive}" onclick="selectMiniDate(${year}, ${month}, ${i})">${i}</div>`;
    }

    // Next month filler days (to complete 42 block grid usually)
    const totalBlocks = firstDay + daysInMonth;
    const nextDays = (totalBlocks % 7 === 0) ? 0 : 7 - (totalBlocks % 7);
    for (let i = 1; i <= nextDays; i++) {
        gridHTML += `<div class="mc-day other-month" onclick="selectMiniDate(${year}, ${month + 1}, ${i})">${i}</div>`;
    }

    gridEl.innerHTML = gridHTML;
}

window.changeMiniMonth = function (offset) {
    viewedWeekDate.setMonth(viewedWeekDate.getMonth() + offset);
    renderMiniCalendar();
    renderInterviews();
};

window.selectMiniDate = function (y, m, d) {
    viewedWeekDate = new Date(y, m, d);
    renderMiniCalendar();
    renderInterviews();
};

function calculateReadiness() {
    let techScore = 30; // Base score
    let commScore = 30; // Base score
    let execScore = 30; // Base score

    // 1. Calculate points from every recorded day in dailyRoutine
    for (const dateStr in appState.dailyRoutine) {
        const routine = appState.dailyRoutine[dateStr];

        const checkDone = (key) => {
            const item = routine[key];
            return (typeof item === 'object' && item !== null) ? item.completed : !!item;
        };

        // Tech Readiness points
        if (checkDone('revise_concept')) techScore += 2;
        if (checkDone('practice_questions')) techScore += 1; // Used to be +2 total but metrics did 1 per? Wait, previous code: (m.questionsSolved * 1) -> Actually the save code gave +2 to questionsSolved. Let's give +2 here.
        if (checkDone('practice_questions')) techScore += 1; // Net +2 total to match original

        // Communication Readiness points
        if (checkDone('mock_interview')) commScore += 5;
    }

    // 2. Add points from Pipeline / Interviews
    // Apps sent (+1 each) - We can count total unique items across all kanban stages since everything starts as applied or gets dragged.
    let totalApps = 0;
    const stages = ['applied', 'screen', 'tech', 'final', 'offer', 'lost'];
    stages.forEach(stage => {
        if (appState.jobPipeline[stage]) {
            totalApps += appState.jobPipeline[stage].length;
        }
    });
    execScore += (totalApps * 1);

    // Offers (+20 each)
    if (appState.jobPipeline.offer) {
        execScore += (appState.jobPipeline.offer.length * 20);
    }

    // Interviews scheduled (+2 each)
    if (appState.scheduledInterviews) {
        commScore += (appState.scheduledInterviews.length * 2);
    }

    // Cap at 100
    return {
        tech: Math.min(techScore, 100),
        comm: Math.min(commScore, 100),
        exec: Math.min(execScore, 100)
    };
}

function getVisibilityDataForChart() {
    const today = new Date().toISOString().split('T')[0];
    const result = [];
    const labels = [];
    const todayObj = new Date(today);

    // Helper to get short month and day (e.g. "Oct 12")
    const getShortDate = (dObj) => {
        return dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayObj);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(getShortDate(d));

        let dailyScore = 0;
        let appliedRolesChecked = false;

        // 1. Calculate points from actual routine inputs
        const routine = appState.dailyRoutine[dateStr];
        if (routine) {
            const checkDone = (key) => {
                const item = routine[key];
                return (typeof item === 'object' && item !== null) ? item.completed : !!item;
            };

            if (checkDone('linkedin_post')) dailyScore += 20;
            if (checkDone('naukri_update')) dailyScore += 10;
            if (checkDone('apply_3_roles')) {
                dailyScore += 30;
                appliedRolesChecked = true;
            }
        }

        // 2. Accurately reflect pipeline data even if routine box wasn't manually updated
        if (!appliedRolesChecked) {
            let appsOnThisDate = 0;
            const stages = ['applied', 'screen', 'tech', 'final', 'offer', 'lost'];
            stages.forEach(stage => {
                if (appState.jobPipeline[stage]) {
                    appsOnThisDate += appState.jobPipeline[stage].filter(c => c.date === dateStr).length;
                }
            });
            if (appsOnThisDate >= 3) {
                dailyScore += 30;
            }
        }

        result.push(dailyScore);
    }

    // Convert individual daily scores into a cumulative, exponential array
    const cumulativeResult = [];
    let runningTotal = 0;

    for (let i = 0; i < result.length; i++) {
        // If the user had activity today, their previous visibility compounds (simulating algorithm reach)
        // If they had 0 activity, their visibility decays slightly or stays flat
        if (result[i] > 0) {
            runningTotal = (runningTotal * 1.25) + result[i]; // 25% exponential bump per active day
        } else {
            runningTotal = runningTotal * 0.95; // 5% decay for inactivity
        }

        // Round to nearest integer for clean charting
        cumulativeResult.push(Math.round(runningTotal));
    }

    return { scores: cumulativeResult, labels: labels };
}

function updateDailyScore(points) {
    // Deprecated: Scores are now dynamically calculated in real-time
    // by evaluating everyday inputs inside getVisibilityDataForChart()
}

// ROUTINE BOARD
function renderRoutine() {
    // Ensure the current day object exists in state
    if (!appState.dailyRoutine[currentDay]) {
        appState.dailyRoutine[currentDay] = {};
    }

    const checkboxes = document.querySelectorAll('.task-item input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const taskKey = cb.dataset.task;

        // Auto-complete "Apply to 3 target roles" based on pipeline dates
        if (taskKey === 'apply_3_roles') {
            let appsOnThisDate = 0;
            const stages = ['applied', 'screen', 'tech', 'final', 'offer', 'lost'];
            stages.forEach(stage => {
                if (appState.jobPipeline[stage]) {
                    appsOnThisDate += appState.jobPipeline[stage].filter(c => c.date === currentDay).length;
                }
            });

            if (appsOnThisDate >= 3) {
                if (!appState.dailyRoutine[currentDay]['apply_3_roles'] || appState.dailyRoutine[currentDay]['apply_3_roles'] === false) {
                    appState.dailyRoutine[currentDay]['apply_3_roles'] = {
                        completed: true,
                        timestamp: new Date().toISOString(),
                        formData: {
                            companies: `Auto-completed: ${appsOnThisDate} applications found in pipeline on this date.`,
                            reachedOut: false
                        }
                    };
                } else if (typeof appState.dailyRoutine[currentDay]['apply_3_roles'] === 'object') {
                    appState.dailyRoutine[currentDay]['apply_3_roles'].completed = true;
                }
            } else {
                // Auto-uncheck if there's no longer 3 tickets for this day
                if (typeof appState.dailyRoutine[currentDay]['apply_3_roles'] === 'object' && appState.dailyRoutine[currentDay]['apply_3_roles'] !== null) {
                    appState.dailyRoutine[currentDay]['apply_3_roles'].completed = false;
                } else if (appState.dailyRoutine[currentDay]['apply_3_roles'] === true) {
                    appState.dailyRoutine[currentDay]['apply_3_roles'] = false;
                }
            }
        }

        const taskData = appState.dailyRoutine[currentDay][taskKey];

        // Handle legacy boolean or new rich object
        let isCompleted = false;
        if (typeof taskData === 'object' && taskData !== null) {
            isCompleted = !!taskData.completed;
        } else {
            isCompleted = !!taskData; // legacy true/false
        }

        cb.checked = isCompleted;

        // Clone to clear old listeners
        const newCb = cb.cloneNode(true);
        cb.parentNode.replaceChild(newCb, cb);

        newCb.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent instant check mark

            const labelElement = newCb.closest('.checkbox-row').querySelector('label');
            const labelText = labelElement ? labelElement.innerText : 'Task Context';

            if (taskKey === 'apply_3_roles' && !isCompleted) {
                addKanbanCard('applied');
                return;
            }

            if (isCompleted) {
                // Task is already completed, open modal to view/edit notes or delete
                openRoutineModal(taskKey, labelText, true, taskData);
            } else {
                // Task is currently incomplete, open the modal to provide new context
                openRoutineModal(taskKey, labelText, false, null);
            }
        });
    });

    // Also update consistency UI when rendering routine
    updateConsistency();
}

function updateConsistency() {
    // Check if 80% tasks done (6 out of 8)
    const taskKeys = [
        'resume_keywords', 'apply_3_roles', 'linkedin_post', 'naukri_update',
        'revise_concept', 'practice_questions', 'mock_interview', 'note_mistakes'
    ];

    let doneCount = 0;
    taskKeys.forEach(k => {
        if (appState.dailyRoutine[currentDay]) {
            const item = appState.dailyRoutine[currentDay][k];
            let isDone = false;
            if (typeof item === 'object' && item !== null) {
                isDone = item.completed;
            } else {
                isDone = !!item;
            }
            if (isDone) doneCount++;
        }
    });

    const progressPct = Math.round((doneCount / taskKeys.length) * 100);

    // Update Progress Bar
    const progBar = document.getElementById('daily-progress');
    const progText = document.getElementById('progress-text');
    if (progBar) progBar.style.width = `${progressPct}%`;
    if (progText) progText.innerText = `${progressPct}% Completed`;

    // Only set consistency days + 1 once per logical "full day"
    if (progressPct >= 100) {
        // Initialize the day wrapper logic if not cleanly present
        if (!appState.dailyRoutine[currentDay]) appState.dailyRoutine[currentDay] = {};

        // Use a property on the specific day object, instead of day index
        if (!appState.dailyRoutine[currentDay].fullyCompleted) {
            appState.dailyRoutine[currentDay].fullyCompleted = true;
            appState.metrics.consistencyDays++;
            playSound('success'); // Play happy sound
        }
    }
}

// KANBAN BOARD
function renderKanban() {
    const stages = ['applied', 'screen', 'tech', 'final', 'offer', 'lost'];

    stages.forEach(stage => {
        const container = document.getElementById(`col-${stage}`);
        container.innerHTML = ''; // Clear

        (appState.jobPipeline[stage] || []).forEach(item => {
            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.draggable = true;
            // Display company name, but track the ID behind the scenes
            card.textContent = item.company;
            card.dataset.id = item.id;

            // Add click listener to open the detailed Jira-style View
            card.addEventListener('click', () => openCardDetails(item.id, stage));

            // Drag Events
            card.addEventListener('dragstart', handleDragStart);

            container.appendChild(card);
        });
    });

    // Setup Drop Zones
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.addEventListener('dragover', handleDragOver);
        col.addEventListener('drop', handleDrop);
        col.addEventListener('dragenter', (e) => e.preventDefault());
    });
}

// Drag & Drop Logic
let draggedItem = null;
let sourceStage = null;
let draggedId = null;

function handleDragStart(e) {
    draggedItem = e.target;
    draggedId = e.target.dataset.id;
    sourceStage = e.target.closest('.kanban-column').dataset.stage;
    e.dataTransfer.effectAllowed = 'move';
    playSound('hover');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const targetCol = e.target.closest('.kanban-column');
    if (!targetCol || !draggedItem || !draggedId) return;

    const targetStage = targetCol.dataset.stage;

    if (sourceStage !== targetStage) {
        // Find the full object representation in the source array
        const cardObj = appState.jobPipeline[sourceStage].find(c => c.id === draggedId);
        if (!cardObj) return;

        // Update object's internal stage
        cardObj.stage = targetStage;

        // Remove from source array
        appState.jobPipeline[sourceStage] = appState.jobPipeline[sourceStage].filter(c => c.id !== draggedId);

        // Add to target array
        if (!appState.jobPipeline[targetStage]) appState.jobPipeline[targetStage] = [];
        appState.jobPipeline[targetStage].push(cardObj);

        // Update UI
        const itemsContainer = document.getElementById(`col-${targetStage}`);
        if (itemsContainer) {
            itemsContainer.appendChild(draggedItem);
        }
        playSound('drag'); // or generic success sound

        // Update Metrics if moving to 'applied' or 'offer' etc
        if (targetStage === 'applied') appState.metrics.appsSent++;

        // Auto-prompt for Meeting Date if moved to Tech or Final
        if (targetStage === 'tech' || targetStage === 'final') {
            cardObj.meetingScheduled = true;
            cardObj.meetingType = targetStage === 'tech' ? 'Technical' : 'Final';

            setTimeout(() => {
                openCardDetails(cardObj.id, targetStage);
                toggleEditCardMode(true);
                showCustomAlert("Please enter the Meeting Date & Time for this scheduled interview.");
            }, 300);
        }

        renderMetrics();
        saveUserData();
    }

    draggedItem = null;
    sourceStage = null;
    draggedId = null;
}

let activeKanbanStage = null;

window.addKanbanCard = function (stage) {
    activeKanbanStage = stage;
    const modal = document.getElementById('add-card-modal');
    modal.classList.add('modal-active');

    // Auto-focus input
    setTimeout(() => {
        document.getElementById('new-company-input').focus();
    }, 100);
};

window.closeAddCardModal = function () {
    const modal = document.getElementById('add-card-modal');
    modal.classList.remove('modal-active');

    // Clear all inputs
    document.getElementById('new-company-input').value = '';
    document.getElementById('new-date-input').value = '';
    document.getElementById('new-salary-input').value = '';
    document.getElementById('new-desc-input').value = '';

    activeKanbanStage = null;
}

window.submitKanbanCard = function () {
    if (!activeKanbanStage) return;

    const company = document.getElementById('new-company-input').value.trim();
    const dateApp = document.getElementById('new-date-input').value || new Date().toISOString().split('T')[0];
    const salary = document.getElementById('new-salary-input').value.trim();
    const desc = document.getElementById('new-desc-input').value.trim();

    if (company) {
        if (!appState.jobPipeline[activeKanbanStage]) appState.jobPipeline[activeKanbanStage] = [];

        // Construct the Rich Object
        const newCard = {
            id: 'card-' + Date.now() + Math.floor(Math.random() * 1000),
            company: company,
            description: desc,
            date: dateApp,
            salary: salary,
            stage: activeKanbanStage
        };

        appState.jobPipeline[activeKanbanStage].push(newCard);

        if (activeKanbanStage === 'applied') {
            appState.metrics.appsSent++;

            // Only auto-complete the daily routine task if the card date is TODAY
            const todayStr = new Date().toISOString().split('T')[0];
            if (dateApp === todayStr) {
                if (!appState.dailyRoutine[currentDay]) appState.dailyRoutine[currentDay] = {};
                const routineData = appState.dailyRoutine[currentDay]['apply_3_roles'];

                let currentCompaniesStr = company;
                let companiesAppliedToday = 1;

                if (routineData && typeof routineData === 'object' && routineData.formData && routineData.formData.companies) {
                    currentCompaniesStr = routineData.formData.companies + '\n' + company;
                    companiesAppliedToday = currentCompaniesStr.split('\n').filter(c => c.trim() !== '').length;
                }

                const wasCompleted = routineData && typeof routineData === 'object' && routineData.completed;

                appState.dailyRoutine[currentDay]['apply_3_roles'] = {
                    completed: wasCompleted || companiesAppliedToday >= 3,
                    timestamp: new Date().toISOString(),
                    formData: {
                        companies: currentCompaniesStr,
                        reachedOut: routineData && routineData.formData ? routineData.formData.reachedOut : false
                    }
                };

                if (!wasCompleted) {
                    if (companiesAppliedToday >= 3) {
                        updateDailyScore(30);
                        setTimeout(() => showCustomAlert("Awesome! You've applied to 3 roles today. Challenge Complete! (+30 Points)"), 100);
                    } else {
                        const remaining = 3 - companiesAppliedToday;
                        setTimeout(() => showCustomAlert(`Added application for ${company}.\n\nAdd ${remaining} more today to complete the 'Apply to 3 target roles' daily task!`), 100);
                    }
                    setTimeout(renderRoutine, 100);
                }
            }
        }

        renderUI(); // Re-renders kanban which builds the div element and sets data-id
        saveUserData();

        playSound('success');
        closeAddCardModal();
    } else {
        showCustomAlert("Please enter a company and role.");
    }
};

// --- VIEW / EDIT MODAL LOGIC ---
window.openCardDetails = function (id, stage) {
    const cardObj = appState.jobPipeline[stage].find(c => c.id === id);
    if (!cardObj) return;

    // Populate Read View
    document.getElementById('view-company-title').innerText = cardObj.company;
    document.getElementById('read-date').innerText = cardObj.date || "--";
    document.getElementById('read-salary').innerText = cardObj.salary || "--";
    document.getElementById('read-desc').innerText = cardObj.description || "No description provided.";

    // Match meeting logic
    const meetingCont = document.getElementById('read-meeting-container');
    if (meetingCont) {
        if (cardObj.meetingScheduled) {
            meetingCont.style.display = 'block';
            document.getElementById('read-meeting-type').innerText = cardObj.meetingType || 'Technical';

            if (cardObj.meetingDate) {
                const d = new Date(cardObj.meetingDate);
                document.getElementById('read-meeting-date').innerText = d.toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            } else {
                document.getElementById('read-meeting-date').innerText = 'TBD';
            }
        } else {
            meetingCont.style.display = 'none';
        }
    }

    const stageMap = { applied: "Applied", screen: "HR Screen", tech: "Technical", final: "Final", offer: "Offer", lost: "Lost" };
    document.getElementById('read-stage-badge').innerText = stageMap[cardObj.stage] || cardObj.stage;

    // Store metadata for saving updates later
    document.getElementById('view-card-id').value = cardObj.id;
    document.getElementById('view-card-stage').value = cardObj.stage;

    // Ensure Read state is active, Edit state is hidden
    toggleEditCardMode(false);

    // Open Modal
    document.getElementById('view-card-modal').classList.add('modal-active');
    playSound('click');
};

window.closeViewCardModal = function () {
    document.getElementById('view-card-modal').classList.remove('modal-active');
};

window.toggleEditCardMode = function (forceEditMode) {
    const readView = document.getElementById('card-read-view');
    const editView = document.getElementById('card-edit-view');

    const isCurrentlyReading = editView.style.display === 'none' || editView.style.display === '';
    const shouldEdit = forceEditMode !== undefined ? forceEditMode : isCurrentlyReading;

    if (shouldEdit) {
        // Going from Read -> Edit
        const id = document.getElementById('view-card-id').value;
        const stage = document.getElementById('view-card-stage').value;
        const cardObj = appState.jobPipeline[stage].find(c => c.id === id);
        if (!cardObj) return;

        // Populate inputs with current object data
        document.getElementById('edit-company-input').value = cardObj.company;
        document.getElementById('edit-date-input').value = cardObj.date || '';
        document.getElementById('edit-salary-input').value = cardObj.salary || '';
        document.getElementById('edit-desc-input').value = cardObj.description || '';

        const isMeeting = !!cardObj.meetingScheduled;
        document.getElementById('edit-meeting-checkbox').checked = isMeeting;
        document.getElementById('edit-meeting-type').value = cardObj.meetingType || 'Technical';
        document.getElementById('edit-meeting-date').value = cardObj.meetingDate || '';
        document.getElementById('edit-meeting-details').style.display = isMeeting ? 'block' : 'none';

        readView.style.display = 'none';
        editView.style.display = 'block';
    } else {
        // Going from Edit -> Read
        readView.style.display = 'block';
        editView.style.display = 'none';
    }
};

window.saveCardDetails = function () {
    const id = document.getElementById('view-card-id').value;
    const stage = document.getElementById('view-card-stage').value;
    const cardObj = appState.jobPipeline[stage].find(c => c.id === id);
    if (!cardObj) return;

    // Capture new inputs
    const newCompany = document.getElementById('edit-company-input').value.trim();
    if (!newCompany) {
        alert("Company Name cannot be empty.");
        return;
    }

    const isMeeting = document.getElementById('edit-meeting-checkbox').checked;
    const meetingType = document.getElementById('edit-meeting-type').value;
    const meetingDate = document.getElementById('edit-meeting-date').value;

    if (isMeeting && !meetingDate) {
        alert("Meeting Date & Time is required when a meeting is scheduled.");
        return;
    }

    cardObj.company = newCompany;
    cardObj.date = document.getElementById('edit-date-input').value;
    cardObj.salary = document.getElementById('edit-salary-input').value.trim();
    cardObj.description = document.getElementById('edit-desc-input').value;

    cardObj.meetingScheduled = isMeeting;
    cardObj.meetingType = isMeeting ? meetingType : null;
    cardObj.meetingDate = isMeeting ? meetingDate : null;

    let targetStage = stage;
    if (isMeeting && (stage === 'screen' || stage === 'applied')) {
        targetStage = meetingType === 'Technical' ? 'tech' : 'final';
    } else if (isMeeting) {
        targetStage = meetingType === 'Technical' ? 'tech' : 'final';
    }

    if (targetStage !== stage) {
        // Move card to new stage array
        appState.jobPipeline[stage] = appState.jobPipeline[stage].filter(c => c.id !== id);
        cardObj.stage = targetStage;
        if (!appState.jobPipeline[targetStage]) appState.jobPipeline[targetStage] = [];
        appState.jobPipeline[targetStage].push(cardObj);
    }

    // Re-render things
    renderKanban();
    renderMiniCalendar();
    renderInterviews();
    saveUserData();

    playSound('success');

    // Re-populate and display Read view
    openCardDetails(id, cardObj.stage);
};

window.promptDeleteCard = function () {
    if (confirm("Are you sure you want to delete this ticket?")) {
        const id = document.getElementById('view-card-id').value;
        const stage = document.getElementById('view-card-stage').value;

        appState.jobPipeline[stage] = appState.jobPipeline[stage].filter(c => c.id !== id);

        closeViewCardModal();
        renderKanban();
        renderMiniCalendar();
        renderInterviews();
        saveUserData();
        playSound('click');
    }
};

// INTERVIEW SCHEDULER
window.addToCalendar = function () {
    const title = document.getElementById('sched-title').value.trim();
    const typeVal = document.getElementById('sched-type').value;
    const dateVal = document.getElementById('sched-date').value;
    const timeVal = document.getElementById('sched-time').value;

    if (!title || !dateVal || !timeVal) {
        alert("Please fill in Company/Role, Date, and Time.");
        return;
    }

    // Format Dates for Google Calendar (YYYYMMDDTHHmmSS)
    const startStr = dateVal.replace(/-/g, '') + 'T' + timeVal.replace(':', '') + '00';

    // Add 1 hour duration
    const dateObj = new Date(`${dateVal}T${timeVal}`);
    dateObj.setHours(dateObj.getHours() + 1);

    function pad(n) { return String(n).padStart(2, '0'); }

    const endStr = dateObj.getFullYear() + pad(dateObj.getMonth() + 1) + pad(dateObj.getDate()) + 'T' + pad(dateObj.getHours()) + pad(dateObj.getMinutes()) + '00';

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('[' + typeVal + '] Interview: ' + title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent('Interview scheduled via Bytapex Career Planner.')}`;

    // Save to App State
    if (!appState.scheduledInterviews) {
        appState.scheduledInterviews = [];
    }

    // Store timestamp of the start time for expiration logic
    const startObj = new Date(`${dateVal}T${timeVal}`);
    appState.metrics.interviews++; // Increment interview count
    appState.scheduledInterviews.push({
        title: title,
        type: typeVal,
        timestamp: startObj.getTime()
    });

    // Clear inputs
    document.getElementById('sched-title').value = '';
    document.getElementById('sched-type').value = 'Technical';
    document.getElementById('sched-date').value = '';
    document.getElementById('sched-time').value = '';

    renderInterviews();
    renderMetrics();
    saveUserData();

    window.open(url, '_blank');
    playSound('success');
};

// METRICS
function renderMetrics() {
    // Dynamically calculate interviews by counting unique tickets that had an interview at any point
    let interviewsCount = 0;
    const interviewStages = ['tech', 'final', 'offer'];
    const allStages = ['applied', 'screen', 'tech', 'final', 'offer', 'lost'];

    allStages.forEach(stage => {
        if (appState.jobPipeline[stage]) {
            appState.jobPipeline[stage].forEach(cardObj => {
                if (interviewStages.includes(stage) || cardObj.meetingScheduled) {
                    interviewsCount++;
                }
            });
        }
    });

    // Animate numbers
    animateValue("apps-count", parseInt(document.getElementById("apps-count").innerText), appState.metrics.appsSent || 0, 1000);
    animateValue("interviews-count", parseInt(document.getElementById("interviews-count").innerText), interviewsCount, 1000);
    animateValue("mocks-count", parseInt(document.getElementById("mocks-count").innerText), appState.metrics.mocks || 0, 1000);
    animateValue("consistency-days", parseInt(document.getElementById("consistency-days").innerText), appState.metrics.consistencyDays || 0, 1000);
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// GSAP ANIMATIONS
function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Fade In Sections (Initial Setup)
    // The actual reveal happens after login in the checkAuth flow.
    gsap.set(".fade-in", {
        y: 30,
        opacity: 0
    });
}

// -------------------------------------------------------------------------------- //
// DAILY ROUTINE TRACKING MODAL
// -------------------------------------------------------------------------------- //

function openRoutineModal(taskKey, taskLabel, isEditMode = false, existingData = null) {
    document.getElementById('routine-active-task-id').value = taskKey;
    document.getElementById('routine-modal-title').innerText = taskLabel;

    const container = document.getElementById('dynamic-form-container');
    const deleteBtn = document.getElementById('delete-routine-btn');
    const confirmBtn = document.getElementById('confirm-routine-btn');

    // Generate Form HTML
    const formHTML = generateRoutineFormHTML(taskKey, isEditMode ? existingData?.formData : null);
    container.innerHTML = formHTML;

    // Configure Buttons
    if (isEditMode && existingData && typeof existingData === 'object') {
        deleteBtn.style.display = 'block';
        confirmBtn.innerText = 'Save Changes';
    } else {
        deleteBtn.style.display = 'none';
        confirmBtn.innerText = 'Mark Complete';
    }

    document.getElementById('routine-task-modal').classList.add('modal-active');
}

function closeRoutineModal() {
    document.getElementById('routine-task-modal').classList.remove('modal-active');
}

function generateRoutineFormHTML(taskKey, formData = null) {
    const data = formData || {};
    const baseStyle = "width: 100%; padding: 12px; margin-bottom: 15px; background: rgba(255,255,255,0.05); border: 1px solid var(--card-border); border-radius: 8px; color: white; outline: none;";
    const labelStyle = "display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px;";

    let html = '';

    switch (taskKey) {
        case 'linkedin_post':
            html += `<label style="${labelStyle}">Post URL</label>
                     <input type="text" id="dyn-url" style="${baseStyle}" placeholder="https://linkedin.com/post/..." value="${data.url || ''}">
                     
                     <label style="${labelStyle}">Post Type</label>
                     <select id="dyn-type" style="${baseStyle}">
                        <option value="original" ${data.type === 'original' ? 'selected' : ''}>Original Post</option>
                        <option value="comment" ${data.type === 'comment' ? 'selected' : ''}>Value Comment</option>
                        <option value="repost" ${data.type === 'repost' ? 'selected' : ''}>Repost with thoughts</option>
                     </select>
                     
                     <label style="${labelStyle}">Key Takeaway / Topic</label>
                     <textarea id="dyn-notes" rows="3" style="${baseStyle} resize: vertical;" placeholder="Shared my top 3 React patterns...">${data.notes || ''}</textarea>`;
            break;

        case 'naukri_update':
            html += `<label style="${labelStyle}">Actions Taken</label>
                     <div style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; color: white;">
                            <input type="checkbox" id="dyn-chk-resume" ${data.updatedResume ? 'checked' : ''}> Updated Resume Document
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; color: white;">
                            <input type="checkbox" id="dyn-chk-headline" ${data.updatedHeadline ? 'checked' : ''}> Refreshed Headline
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; color: white;">
                            <input type="checkbox" id="dyn-chk-skills" ${data.addedSkills ? 'checked' : ''}> Added New Skills
                        </label>
                     </div>
                     <label style="${labelStyle}">Specific Updates</label>
                     <textarea id="dyn-notes" rows="3" style="${baseStyle} resize: vertical;" placeholder="Added AWS cloud practitioner keywords...">${data.notes || ''}</textarea>`;
            break;

        case 'apply_3_roles':
            html += `<label style="${labelStyle}">Companies Applied To</label>
                     <textarea id="dyn-companies" rows="3" style="${baseStyle} resize: vertical;" placeholder="1. Google (Frontend)&#10;2. Amazon (SDE II)&#10;3. Notion (Web)">${data.companies || ''}</textarea>
                     
                     <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; color: white;">
                        <input type="checkbox" id="dyn-chk-network" ${data.reachedOut ? 'checked' : ''}> Reached out to Recruiter/Hiring Manager?
                     </label>`;
            break;

        case 'revise_concept':
            html += `<label style="${labelStyle}">Concept Name</label>
                     <input type="text" id="dyn-concept" style="${baseStyle}" placeholder="e.g. System Design: Event Driven Arch" value="${data.concept || ''}">

                     <label style="${labelStyle}">Source Link / Reference</label>
                     <input type="text" id="dyn-source" style="${baseStyle}" placeholder="https://youtube.com/..." value="${data.source || ''}">

                     <label style="${labelStyle}">Summary</label>
                     <textarea id="dyn-summary" rows="4" style="${baseStyle} resize: vertical;" placeholder="Learned about pub/sub models...">${data.summary || ''}</textarea>`;
            break;

        case 'practice_questions':
            html += `<label style="${labelStyle}">Platform</label>
                     <select id="dyn-platform" style="${baseStyle}">
                        <option value="leetcode" ${data.platform === 'leetcode' ? 'selected' : ''}>LeetCode</option>
                        <option value="hackerrank" ${data.platform === 'hackerrank' ? 'selected' : ''}>HackerRank</option>
                        <option value="frontend_eval" ${data.platform === 'frontend_eval' ? 'selected' : ''}>FrontendEval</option>
                        <option value="other" ${data.platform === 'other' ? 'selected' : ''}>Other</option>
                     </select>
                     
                     <label style="${labelStyle}">Question Link(s)</label>
                     <textarea id="dyn-links" rows="2" style="${baseStyle} resize: vertical;" placeholder="https://leetcode.com/problems/two-sum">${data.links || ''}</textarea>

                     <label style="${labelStyle}">Average Difficulty</label>
                     <select id="dyn-diff" style="${baseStyle}">
                        <option value="easy" ${data.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                        <option value="medium" ${data.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="hard" ${data.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                     </select>`;
            break;

        case 'resume_keywords':
            html += `<label style="${labelStyle}">Target Role</label>
                     <input type="text" id="dyn-role" style="${baseStyle}" placeholder="e.g. Senior Frontend Engineer" value="${data.role || ''}">

                     <label style="${labelStyle}">Keywords / Achievements Added</label>
                     <textarea id="dyn-keywords" rows="4" style="${baseStyle} resize: vertical;" placeholder="- CI/CD pipelines&#10;- Webpack optimization">${data.keywords || ''}</textarea>`;
            break;

        case 'mock_interview':
            html += `<label style="${labelStyle}">Interview Type</label>
                     <select id="dyn-type" style="${baseStyle}">
                        <option value="behavioral" ${data.type === 'behavioral' ? 'selected' : ''}>Behavioral (Leadership principles)</option>
                        <option value="technical" ${data.type === 'technical' ? 'selected' : ''}>Technical / DSA</option>
                        <option value="system_design" ${data.type === 'system_design' ? 'selected' : ''}>System Design</option>
                     </select>

                     <label style="${labelStyle}">Self-Rating</label>
                     <select id="dyn-rating" style="${baseStyle}">
                        <option value="1" ${data.rating === '1' ? 'selected' : ''}>1 - Struggled terribly</option>
                        <option value="2" ${data.rating === '2' ? 'selected' : ''}>2 - Needs lots of work</option>
                        <option value="3" ${data.rating === '3' ? 'selected' : ''}>3 - Average, survived</option>
                        <option value="4" ${data.rating === '4' ? 'selected' : ''}>4 - Good, minor mistakes</option>
                        <option value="5" ${data.rating === '5' ? 'selected' : ''}>5 - Flawless execution</option>
                     </select>

                     <label style="${labelStyle}">Reflection / Areas to Improve</label>
                     <textarea id="dyn-reflection" rows="4" style="${baseStyle} resize: vertical;" placeholder="Need to use STAR method more clearly...">${data.reflection || ''}</textarea>`;
            break;

        case 'note_mistakes':
            html += `<label style="${labelStyle}">Mistakes made today</label>
                     <textarea id="dyn-mistakes" rows="3" style="${baseStyle} resize: vertical;" placeholder="Fumbled on the React hooks question...">${data.mistakes || ''}</textarea>
                     
                     <label style="${labelStyle}">Action Plan to fix</label>
                     <textarea id="dyn-plan" rows="3" style="${baseStyle} resize: vertical;" placeholder="Will read the React docs on useEffect edge cases.">${data.plan || ''}</textarea>`;
            break;

        default:
            html += `<p style="color: white;">Context logging not available for this task.</p>`;
    }

    return html;
}

function extractRoutineFormData(taskKey) {
    let data = {};
    const safeVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };
    const safeCheck = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };

    switch (taskKey) {
        case 'linkedin_post':
            data = { url: safeVal('dyn-url'), type: safeVal('dyn-type'), notes: safeVal('dyn-notes') }; break;
        case 'naukri_update':
            data = { updatedResume: safeCheck('dyn-chk-resume'), updatedHeadline: safeCheck('dyn-chk-headline'), addedSkills: safeCheck('dyn-chk-skills'), notes: safeVal('dyn-notes') }; break;
        case 'apply_3_roles':
            data = { companies: safeVal('dyn-companies'), reachedOut: safeCheck('dyn-chk-network') }; break;
        case 'revise_concept':
            data = { concept: safeVal('dyn-concept'), source: safeVal('dyn-source'), summary: safeVal('dyn-summary') }; break;
        case 'practice_questions':
            data = { platform: safeVal('dyn-platform'), links: safeVal('dyn-links'), difficulty: safeVal('dyn-diff') }; break;
        case 'resume_keywords':
            data = { role: safeVal('dyn-role'), keywords: safeVal('dyn-keywords') }; break;
        case 'mock_interview':
            data = { type: safeVal('dyn-type'), rating: safeVal('dyn-rating'), reflection: safeVal('dyn-reflection') }; break;
        case 'note_mistakes':
            data = { mistakes: safeVal('dyn-mistakes'), plan: safeVal('dyn-plan') }; break;
    }
    return data;
}

function saveRoutineTask() {
    const taskKey = document.getElementById('routine-active-task-id').value;

    // Extract dynamic form fields
    const formData = extractRoutineFormData(taskKey);

    if (!appState.dailyRoutine[currentDay]) appState.dailyRoutine[currentDay] = {};

    // Check if it was purely an edit so we don't grant duplicate points
    const existingData = appState.dailyRoutine[currentDay][taskKey];
    const isNewCompletion = !existingData || (typeof existingData === 'boolean' && !existingData) || (typeof existingData === 'object' && !existingData.completed);

    // Build the rich context object
    const taskPayload = {
        completed: true,
        timestamp: new Date().toISOString(),
        formData: formData
    };

    appState.dailyRoutine[currentDay][taskKey] = taskPayload;

    if (isNewCompletion) {
        // Grant Points based on standard logic only if newly checked
        if (taskKey === 'revise_concept') appState.metrics.conceptsRevised++;
        if (taskKey === 'practice_questions') appState.metrics.questionsSolved += 2;
        if (taskKey === 'mock_interview') appState.metrics.mocks++;

        if (taskKey === 'linkedin_post') updateDailyScore(20);
        if (taskKey === 'naukri_update') updateDailyScore(10);
        if (taskKey === 'apply_3_roles') updateDailyScore(30);
    }

    playSound('click'); // Play confirm sound
    closeRoutineModal();

    updateConsistency();
    saveUserData();
    renderUI();
}

function deleteRoutineTask() {
    const taskKey = document.getElementById('routine-active-task-id').value;

    // Reset state to incomplete
    if (appState.dailyRoutine[currentDay]) {
        appState.dailyRoutine[currentDay][taskKey] = false;
    }

    closeRoutineModal();
    renderRoutine(); // Fully re-render to erase checkmark
    saveUserData();
    renderUI(); // Re-calculate consistency metrics
}

// -------------------------------------------------------------------------------- //
// STRATEGY EXPLANATION MODAL
// -------------------------------------------------------------------------------- //

const strategyContent = {
    'ats': {
        title: 'Salesforce ATS Keywords',
        icon: 'fa-file-lines',
        body: '<p>Applicant Tracking Systems (ATS) scan resumes for specific keywords before a human recruiter ever sees them. To pass this filter:</p><ul style="margin-top:10px; padding-left:20px; margin-bottom: 15px;"><li>List your active Salesforce Certifications and Trailhead Ranger status.</li><li>Include specific clouds (e.g., Sales Cloud, Service Cloud, CPQ) matching the job description.</li><li>Highlight core technical toolings (Apex, LWC, Flow, SOQL) explicitly.</li></ul>'
    },
    'linkedin': {
        title: 'Engaging the Ohana',
        icon: 'fa-linkedin',
        body: '<p>The Salesforce "Ohana" is highly active on LinkedIn and X. Consistent activity pushes your profile higher in recruiter searches.</p><ul style="margin-top:10px; padding-left:20px; margin-bottom: 15px;"><li>Post your Trailhead milestones and project completions.</li><li>Engage with Salesforce MVPs and the Trailblazer Community.</li><li>Share your takeaways from Salesforce release notes.</li></ul>'
    },
    'roles': {
        title: 'Ecosystem Targeting',
        icon: 'fa-briefcase',
        body: '<p>Job hunting in the Salesforce ecosystem requires targeting the right type of employer.</p><ul style="margin-top:10px; padding-left:20px; margin-bottom: 15px;"><li>Apply across different company types: SIs (Consultancies), ISVs (AppExchange Partners), and End-Users.</li><li>Tailor your resume depending on if the role requires deep Apex (Dev) or complex Flow architecture (Admin/App Builder).</li><li>Consistency is key: 5 targeted applications a day is better than 50 generic ones.</li></ul>'
    },
    'star': {
        title: 'STAR Method (Salesforce)',
        icon: 'fa-star',
        body: '<p>The STAR method is crucial for behavioral questions, especially when discussing project architectures.</p><ul style="margin-top:10px; padding-left:20px; margin-bottom: 15px;"><li><b>Situation:</b> Describe the business requirement or legacy system limit.</li><li><b>Task:</b> What Salesforce solution were you tasked to build?</li><li><b>Action:</b> Did you choose Flow over Apex? How did you handle OWDs?</li><li><b>Result:</b> "Reduced manual entry by 10 hours/week" or "Avoided hitting Governor Limits."</li></ul>'
    },
    'think_aloud': {
        title: 'Governor Limits & Logic',
        icon: 'fa-brain',
        body: '<p>In technical interviews, silence is your enemy. The interviewer wants to evaluate your problem-solving process and your awareness of the multi-tenant architecture.</p><ul style="margin-top:10px; padding-left:20px; margin-bottom: 15px;"><li>State your initial assumptions about the Sharing Model (OWDs).</li><li>Immediately discuss Bulkification and Governor Limits when proposing Apex or Flows.</li><li>Explain edge cases, such as handling large data volumes (LDV).</li></ul>'
    },
    'mock': {
        title: 'Trailblazer Mocks',
        icon: 'fa-users-viewfinder',
        body: '<p>Live mock interviews simulate the pressure of the real thing better than practicing alone.</p><ul style="margin-top:10px; padding-left:20px; margin-bottom: 15px;"><li>Schedule a mock interview with a fellow Trailblazer or mentor.</li><li>Practice explaining complex Salesforce concepts (like Order of Execution) to a non-technical stakeholder.</li><li>Record yourself and ask for harsh feedback.</li></ul>'
    }
};

function openStrategyModal(topicKey) {
    const data = strategyContent[topicKey];
    if (!data) return;

    document.getElementById('strategy-modal-title-text').innerText = data.title;
    document.getElementById('strategy-modal-icon').className = `fa-solid ${data.icon}`;
    document.getElementById('strategy-modal-body').innerHTML = data.body;

    document.getElementById('strategy-explain-modal').classList.add('modal-active');
}

function closeStrategyModal() {
    document.getElementById('strategy-explain-modal').classList.remove('modal-active');
}

// -------------------------------------------------------------------------------- //
// CUSTOM ALERT MODAL
// -------------------------------------------------------------------------------- //

window.showCustomAlert = function (message) {
    document.getElementById('custom-alert-message').innerText = message;
    document.getElementById('custom-alert-modal').classList.add('modal-active');
}

window.closeCustomAlert = function () {
    document.getElementById('custom-alert-modal').classList.remove('modal-active');
}

// -------------------------------------------------------------------------------- //
// PERSONAL INFORMATION AUTO-PROMPT
// -------------------------------------------------------------------------------- //

const countryStateMap = {
    "United States": [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
        "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
        "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
        "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
        "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
    ],
    "India": [
        "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
        "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
        "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
        "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ],
    "United Kingdom": [
        "England", "Northern Ireland", "Scotland", "Wales"
    ],
    "Canada": [
        "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan",
        "Northwest Territories", "Nunavut", "Yukon"
    ],
    "Australia": [
        "Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"
    ]
};

window.updateStateOptions = function () {
    const country = document.getElementById('pi-country').value;
    const stateSelect = document.getElementById('pi-state');

    stateSelect.innerHTML = '<option value="" disabled selected style="background: #121212">Select State</option>';

    if (country && countryStateMap[country]) {
        countryStateMap[country].forEach(state => {
            const opt = document.createElement('option');
            opt.value = state;
            opt.style.background = "#121212";
            opt.innerText = state;
            stateSelect.appendChild(opt);
        });
    } else {
        stateSelect.innerHTML = '<option value="" disabled selected style="background: #121212">Select Country First</option>';
    }
};

window.openPersonalInfoModal = function () {
    const modal = document.getElementById('personal-info-modal');
    if (!modal) return;

    // Pre-fill email
    document.getElementById('pi-email').value = currentUser || '';

    // Pre-fill existing data if any
    if (appState.personalInfo) {
        document.getElementById('pi-name').value = appState.personalInfo.name || '';
        document.getElementById('pi-phone').value = appState.personalInfo.phone || '';
        document.getElementById('pi-profile').value = appState.personalInfo.profile || 'working_professional';
        document.getElementById('pi-experience').value = appState.personalInfo.experience || 0;
        document.getElementById('pi-role').value = appState.personalInfo.targetRole || '';

        if (appState.personalInfo.country) {
            document.getElementById('pi-country').value = appState.personalInfo.country;
            updateStateOptions();
            if (appState.personalInfo.state) {
                document.getElementById('pi-state').value = appState.personalInfo.state;
            }
        }
    }

    modal.style.display = 'flex';
    gsap.fromTo(modal.querySelector('.modal-content'),
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
};

window.savePersonalInfo = function () {
    const name = document.getElementById('pi-name').value.trim();
    const phone = document.getElementById('pi-phone').value.trim();
    const country = document.getElementById('pi-country').value;
    const state = document.getElementById('pi-state').value;
    const profile = document.getElementById('pi-profile').value;
    const experience = parseFloat(document.getElementById('pi-experience').value) || 0;
    const targetRole = document.getElementById('pi-role').value.trim();

    // Basic Validation
    if (!name || !phone || !country || !state || !targetRole) {
        showCustomAlert("Please fill in all mandatory fields before continuing.");
        return;
    }

    // Update appState
    appState.personalInfo = {
        name,
        phone,
        email: currentUser,
        country,
        state,
        profile,
        experience,
        targetRole
    };

    // Save to Cloud
    saveUserData();
    playSound('success');

    // Close Modal
    const modal = document.getElementById('personal-info-modal');
    gsap.to(modal.querySelector('.modal-content'), {
        scale: 0.9,
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            modal.style.display = 'none';
        }
    });

    // Optionally re-render UI if personal info is displayed anywhere on dashboard
    // renderUI();

    // Update Profile Button Text
    const firstName = appState.personalInfo.name.split(' ')[0];
    const profileBtnText = document.getElementById('header-profile-name');
    if (profileBtnText) profileBtnText.innerText = firstName;
};

window.checkPersonalInfoComplete = function () {
    // If personalInfo object doesn't exist or critical fields are missing, prompt user
    if (!appState.personalInfo ||
        !appState.personalInfo.name ||
        !appState.personalInfo.targetRole ||
        !appState.personalInfo.phone) {

        setTimeout(() => {
            openPersonalInfoModal();
        }, 1000); // Wait 1s after dashboard loads to pop up
    } else {
        // Profile exists, update the header button to their first name
        const firstName = appState.personalInfo.name.split(' ')[0];
        const profileBtnText = document.getElementById('header-profile-name');
        if (profileBtnText) profileBtnText.innerText = firstName;
    }
};
