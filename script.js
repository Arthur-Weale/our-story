import data from './data/proposal.json' with { type: 'json' };

const openButton = document.getElementById('open-button');
const introScreen = document.getElementById('intro-screen');
const storyScreen = document.getElementById('story-screen');
const proposalScreen = document.getElementById('proposal-screen');
const responseScreen = document.getElementById('response-screen');
const gateScreen = document.getElementById('gate-screen');
const gateForm = document.getElementById('gate-form');
const gatePassword = document.getElementById('gate-password');
const gateStatus = document.getElementById('gate-status');

const sceneTitle = document.getElementById('scene-title');
const sceneImage = document.getElementById('scene-image');
const sceneText = document.getElementById('scene-text');
const sceneNumber = document.getElementById('scene-number');
const nextButton = document.getElementById('next-button');
const storyBackButton = document.getElementById('story-back');
const proposalBackButton = document.getElementById('proposal-back');
const responseBackButton = document.getElementById('response-back');

const responseTitle = document.getElementById('response-title');
const responseMeta = document.getElementById('response-meta');
const responseAnimation = document.getElementById('response-animation');
const responseLockNote = document.getElementById('response-lock-note');
const responseNote = document.getElementById('response-note');
const messageBox = document.getElementById('message-box');
const saveMessageButton = document.getElementById('save-message');
const messageStatus = document.getElementById('message-status');
const holdHeart = document.getElementById('hold-heart');
const heartReactions = document.getElementById('heart-reactions');
const heartHoldArea = document.getElementById('heart-hold-area');
const anniversaryBox = document.getElementById('anniversary-box');
const anniversaryDate = document.getElementById('anniversary-date');
const calendarLink = document.getElementById('calendar-link');
const proposalButtons = document.getElementById('proposal-buttons');
const yesButton = document.getElementById('yes-button');
const maybeButton = document.getElementById('maybe-button');
const noButton = document.getElementById('no-button');

const proposal = data;
let currentScene = 0;
let holdTimer;
let currentAnswer = '';
let answeredAt = null;
let recordedAnswer = null;
const HOLD_DURATION = 1800;
const DODGE_LIMIT = 10;

const isSeparateLocalPreview = ['5500', '5501'].includes(window.location.port)
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const apiOrigin = isSeparateLocalPreview
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : '';

function apiFetch(path, options = {}) {
    return fetch(`${apiOrigin}${path}`, {
        ...options,
        credentials: 'include'
    });
}

async function checkForSavedAnswer() {
    try {
        const result = await apiFetch('/api/proposal', { cache: 'no-store' });
        if (!result.ok) throw new Error('Could not check for a saved answer.');

        const savedAnswer = await result.json();
        if (savedAnswer?.answer) {
            recordedAnswer = savedAnswer;
            gateScreen.hidden = true;
            introScreen.hidden = false;
            return;
        }

        gateStatus.textContent = 'Enter the secret colour to begin 💜';
    } catch (error) {
        gateStatus.textContent = 'I couldn’t check for a saved answer. Enter the password to continue.';
    }
}

gateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    gateStatus.textContent = 'Checking the secret…';

    try {
        const result = await apiFetch('/api/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: gatePassword.value.trim() })
        });

        if (!result.ok) {
            if (result.status === 409) {
                await checkForSavedAnswer();
                return;
            }
            if (result.status === 401) {
                gateStatus.textContent = 'Not quite, try her favourite colour again 💜';
                gatePassword.select();
            } else {
                gateStatus.textContent = 'The API could not verify the password. Make sure the server is running.';
            }
            return;
        }

        gateScreen.hidden = true;
        introScreen.hidden = false;
    } catch (error) {
        gateStatus.textContent = 'Could not reach the API. Open the page through npm start, or run the API on port 3000.';
    }
});

function renderScreen() {
    const scene = proposal[currentScene];

    sceneTitle.textContent = scene.name;
    sceneImage.src = scene.gif;
    sceneImage.alt = scene.name;
    sceneText.textContent = scene.text;
    sceneNumber.textContent = String(currentScene + 1).padStart(2, '0');
}

openButton.addEventListener('click', () => {
    introScreen.hidden = true;
    storyScreen.hidden = false;
    renderScreen();
});

nextButton.addEventListener('click', () => {
    if (currentScene >= proposal.length - 1) {
        storyScreen.hidden = true;
        if (recordedAnswer) {
            showLockedResponse(recordedAnswer);
        } else {
            resetChoiceButtons();
            proposalScreen.hidden = false;
        }
        return;
    }

    currentScene += 1;
    renderScreen();
});

storyBackButton.addEventListener('click', () => {
    if (currentScene === 0) {
        storyScreen.hidden = true;
        introScreen.hidden = false;
        return;
    }

    currentScene -= 1;
    renderScreen();
});

proposalBackButton.addEventListener('click', () => {
    proposalScreen.hidden = true;
    currentScene = proposal.length - 1;
    renderScreen();
    storyScreen.hidden = false;
});

responseBackButton.addEventListener('click', () => {
    responseScreen.hidden = true;
    currentScene = proposal.length - 1;
    renderScreen();
    storyScreen.hidden = false;
});

function resetChoiceButtons() {
    for (const button of [maybeButton, noButton]) {
        button.hidden = false;
        button.classList.remove('is-running', 'gave-up');
        button.style.left = '';
        button.style.top = '';
        button.dataset.moves = '0';
        proposalButtons.append(button);
    }
}

function showResponse(answer) {
    currentAnswer = answer;
    answeredAt = new Date();
    const formattedDate = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
        timeStyle: 'short'
    }).format(answeredAt);

    proposalScreen.hidden = true;
    responseScreen.hidden = false;
    responseTitle.textContent = `She said ${answer}!`;
    responseMeta.textContent = `Answered on ${formattedDate}`;
    responseAnimation.src = answer === 'Yes' ? 'assets/yes.gif' : 'assets/sad.gif';
    responseAnimation.alt = answer === 'Yes' ? 'A happy celebration' : 'A sad Goma reaction';
    responseBackButton.hidden = false;
    responseLockNote.hidden = true;
    messageBox.hidden = false;
    heartHoldArea.hidden = false;
    maybeButton.hidden = true;
    noButton.hidden = true;
    responseNote.disabled = false;
    saveMessageButton.disabled = false;
    saveMessageButton.hidden = false;
    messageStatus.textContent = '';
    anniversaryBox.hidden = answer !== 'Yes';
    if (answer === 'Yes') {
        const localToday = new Date();
        anniversaryDate.value = [
            localToday.getFullYear(),
            String(localToday.getMonth() + 1).padStart(2, '0'),
            String(localToday.getDate()).padStart(2, '0')
        ].join('-');
        updateCalendarLink();
    }

    responseNote.value = '';
}

function showLockedResponse(savedAnswer) {
    recordedAnswer = savedAnswer;
    const answer = savedAnswer.answer;
    const answeredAt = new Date(savedAnswer.time);
    const formattedDate = Number.isNaN(answeredAt.getTime())
        ? ''
        : new Intl.DateTimeFormat(undefined, {
            dateStyle: 'full',
            timeStyle: 'short'
        }).format(answeredAt);

    gateScreen.hidden = true;
    introScreen.hidden = true;
    storyScreen.hidden = true;
    proposalScreen.hidden = true;
    responseScreen.hidden = false;
    responseTitle.textContent = `She said ${answer}!`;
    responseMeta.textContent = formattedDate ? `Answered on ${formattedDate}` : '';
    responseAnimation.src = answer === 'Yes' ? 'assets/yes.gif' : 'assets/sad.gif';
    responseAnimation.alt = answer === 'Yes' ? 'A happy celebration' : 'A sad Goma reaction';
    responseBackButton.hidden = false;
    responseLockNote.hidden = false;
    messageBox.hidden = true;
    anniversaryBox.hidden = true;
    heartHoldArea.hidden = true;
    maybeButton.hidden = true;
    noButton.hidden = true;
}

yesButton.addEventListener('click', () => showResponse('Yes'));
maybeButton.addEventListener('click', () => showResponse('Maybe'));
noButton.addEventListener('click', () => showResponse('No'));

saveMessageButton.addEventListener('click', async () => {
    const response = {
        answer: currentAnswer,
        message: responseNote.value.trim(),
        time: answeredAt.toISOString()
    };

    saveMessageButton.disabled = true;
    messageStatus.textContent = 'Sending your response…';

    try {
        const result = await apiFetch('/api/proposal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
        });

        if (!result.ok) {
            const error = new Error('The server could not save this response.');
            error.status = result.status;
            throw error;
        }

        messageStatus.textContent = 'Your answer and message have been sent. 💌';
        showLockedResponse({
            answer: currentAnswer,
            time: answeredAt.toISOString()
        });
    } catch (error) {
        if (error.status === 409) {
            const saved = await apiFetch('/api/proposal', { cache: 'no-store' });
            if (saved.ok) {
                const savedAnswer = await saved.json();
                if (savedAnswer?.answer) showLockedResponse(savedAnswer);
                return;
            }
        }
        messageStatus.textContent = 'Your response could not be recorded. Check the connection and try again.';
    } finally {
        saveMessageButton.disabled = false;
    }
});

function updateCalendarLink() {
    if (!anniversaryDate.value) return;
    const [year, month, day] = anniversaryDate.value.split('-');
    const start = `${year}${month}${day}`;
    const nextDay = new Date(Number(year), Number(month) - 1, Number(day) + 1);
    const end = [
        nextDay.getFullYear(),
        String(nextDay.getMonth() + 1).padStart(2, '0'),
        String(nextDay.getDate()).padStart(2, '0')
    ].join('');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.search = new URLSearchParams({
        action: 'TEMPLATE',
        text: 'Our anniversary 💕',
        dates: `${start}/${end}`,
        details: 'A day to celebrate us.'
    });
    calendarLink.href = url.toString();
}

anniversaryDate.addEventListener('change', updateCalendarLink);

function makeButtonRun(button, event) {
    if (event.pointerType === 'touch' && event.type === 'pointerenter') return;
    if (event.pointerType !== 'touch' && event.type === 'pointerdown') return;
    if (button.classList.contains('gave-up')) return;

    const moves = Number(button.dataset.moves || 0);
    if (moves >= DODGE_LIMIT) return;

    if (event.pointerType === 'touch') event.preventDefault();

    const messages = button === maybeButton
        ? ['Wait—maybe? 🥺', 'Think about it? 💭', 'One tiny maybe? 🌸', 'Pretty please? 🙈', 'You can say maybe! 💐', 'I believe in us! 🥹', 'Still considering? 😳', 'Almost out of wiggles! 🏃', 'Last little escape! 💨', 'Okay, I give up 😅']
        : ['Wait, really? 😳', 'Give me a chance? 🥺', 'My heart! 💔', 'Are you sure? 🥹', 'Please reconsider? 🙏', 'One more thought? 💭', 'I am getting tired 😮‍💨', 'Just checking! 😅', 'Last escape! 🏃', 'Okay, I give up 😔'];

    button.classList.add('is-running');
    document.body.append(button);
    button.textContent = messages[moves];
    const buttonRect = button.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - buttonRect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - buttonRect.height - 8);
    const yesRect = yesButton.getBoundingClientRect();
    let left = 0;
    let top = 0;

    for (let attempt = 0; attempt < 12; attempt += 1) {
        left = 8 + Math.random() * (maxLeft - 8);
        top = 8 + Math.random() * (maxTop - 8);
        const overlapsYes = left < yesRect.right
            && left + buttonRect.width > yesRect.left
            && top < yesRect.bottom
            && top + buttonRect.height > yesRect.top;
        if (!overlapsYes) break;
    }

    button.dataset.moves = String(moves + 1);
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;

    if (moves + 1 >= DODGE_LIMIT) {
        button.classList.remove('is-running');
        button.classList.add('gave-up');
    }
}

for (const button of [maybeButton, noButton]) {
    button.addEventListener('pointerenter', (event) => makeButtonRun(button, event));
    button.addEventListener('pointerdown', (event) => makeButtonRun(button, event));
}

checkForSavedAnswer();

function startHeartHold(event) {
    if (holdHeart.getAttribute('aria-pressed') === 'true') return;
    event.preventDefault();
    holdHeart.classList.add('is-holding');
    holdHeart.style.setProperty('--hold-progress', '0%');

    const startedAt = performance.now();
    const updateProgress = (now) => {
        if (!holdHeart.classList.contains('is-holding')) return;
        const progress = Math.min((now - startedAt) / HOLD_DURATION, 1);
        holdHeart.style.setProperty('--hold-progress', `${progress * 100}%`);
        if (progress < 1) {
            holdTimer = requestAnimationFrame(updateProgress);
        } else {
            holdHeart.classList.remove('is-holding');
            holdHeart.classList.add('is-complete');
            holdHeart.setAttribute('aria-pressed', 'true');
            heartReactions.classList.add('is-visible');
            heartReactions.setAttribute('aria-hidden', 'false');
        }
    };
    holdTimer = requestAnimationFrame(updateProgress);
}

function cancelHeartHold() {
    if (holdHeart.getAttribute('aria-pressed') === 'true') return;
    holdHeart.classList.remove('is-holding');
    holdHeart.style.setProperty('--hold-progress', '0%');
    cancelAnimationFrame(holdTimer);
}

holdHeart.addEventListener('pointerdown', startHeartHold);
holdHeart.addEventListener('pointerup', cancelHeartHold);
holdHeart.addEventListener('pointercancel', cancelHeartHold);
holdHeart.addEventListener('pointerleave', cancelHeartHold);
holdHeart.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') startHeartHold(event);
});
holdHeart.addEventListener('keyup', cancelHeartHold);
