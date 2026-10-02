import { randomUUID } from 'node:crypto';
import { connectToDatabase } from '../model/db.js';

const unlockedSessions = new Map();
const proposalPassword = 'purple';

function getSessionToken(req) {
    const cookieHeader = req.headers.cookie ?? '';
    const sessionCookie = cookieHeader
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('proposal_session='));
    return sessionCookie?.slice('proposal_session='.length);
}

function hasUnlockedSession(req) {
    const token = getSessionToken(req);
    const expiresAt = token && unlockedSessions.get(token);
    if (!expiresAt || expiresAt < Date.now()) {
        if (token) unlockedSessions.delete(token);
        return false;
    }
    return true;
}

async function getAnswer(req, res) {
    try {
        const { users } = await connectToDatabase();
        const latestAnswer = await users.findOne(
            { name: 'Ntokozo' },
            { sort: { time: -1 } }
        );
        res.json(latestAnswer
            ? { answer: latestAnswer.answer, time: latestAnswer.time }
            : null);
    } catch (error) {
        console.error('Error fetching proposal response:', error.message);
        res.status(500).json({ error: 'Could not fetch the response.' });
    }
}

async function saveAnswer(req, res) {
    if (!hasUnlockedSession(req)) {
        return res.status(401).json({ error: 'Unlock the proposal before responding.' });
    }

    try {
        const { answer, message = '', time } = req.body ?? {};
        const validAnswers = ['Yes', 'Maybe', 'No'];
        const answeredAt = new Date(time);

        if (!validAnswers.includes(answer)
            || typeof message !== 'string'
            || message.length > 500
            || !time
            || Number.isNaN(answeredAt.getTime())) {
            return res.status(400).json({ error: 'Invalid response payload.' });
        }

        const { users } = await connectToDatabase();
        const existingAnswer = await users.findOne({ name: 'Ntokozo' });
        if (existingAnswer) {
            return res.status(409).json({ error: 'A response has already been recorded.' });
        }

        const result = await users.insertOne({
            _id: 'ntokozo-proposal-response',
            name: 'Ntokozo',
            answer,
            message,
            time: answeredAt
        });

        res.status(201).json({
            message: 'Response saved successfully.',
            id: result.insertedId
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'A response has already been recorded.' });
        }
        console.error('Error saving proposal response:', error.message);
        res.status(500).json({ error: 'Could not save the response.' });
    }
}

async function unlockProposal(req, res) {
    const password = req.body?.password;
    if (typeof password !== 'string' || password.trim().toLowerCase() !== proposalPassword) {
        return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = randomUUID();
    const maxAgeSeconds = 2 * 60 * 60;
    unlockedSessions.set(token, Date.now() + maxAgeSeconds * 1000);
    const secureFlag = req.secure ? '; Secure' : '';
    res.setHeader(
        'Set-Cookie',
        `proposal_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secureFlag}`
    );
    res.json({ unlocked: true });
}

export { getAnswer, saveAnswer, unlockProposal };
