const express = require('express');
const session = require('express-session');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "111111";

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'video-hub-secret-key-2024-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const RESOURCES_FILE = 'resources.txt';
const QUICKACCESS_FILE = 'quickaccess.txt';

async function readFile(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeFile(filename, data) {
    await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
}

function requireAuth(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
    }
    next();
}

app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true, isAdmin: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
});

app.get('/api/resources', async (req, res) => {
    try {
        const resources = await readFile(RESOURCES_FILE);
        res.json(resources);
    } catch (error) {
        console.error('Error reading resources:', error);
        res.status(500).json({ error: 'Failed to read resources' });
    }
});

app.post('/api/resources', requireAuth, async (req, res) => {
    try {
        const resources = await readFile(RESOURCES_FILE);
        resources.push(req.body);
        await writeFile(RESOURCES_FILE, resources);
        res.json({ success: true, resource: req.body });
    } catch (error) {
        console.error('Error adding resource:', error);
        res.status(500).json({ error: 'Failed to add resource' });
    }
});

app.put('/api/resources/:id', requireAuth, async (req, res) => {
    try {
        const resources = await readFile(RESOURCES_FILE);
        const index = resources.findIndex(r => r.id === parseInt(req.params.id));
        if (index !== -1) {
            resources[index] = req.body;
            await writeFile(RESOURCES_FILE, resources);
            res.json({ success: true, resource: req.body });
        } else {
            res.status(404).json({ error: 'Resource not found' });
        }
    } catch (error) {
        console.error('Error updating resource:', error);
        res.status(500).json({ error: 'Failed to update resource' });
    }
});

app.delete('/api/resources/:id', requireAuth, async (req, res) => {
    try {
        const resources = await readFile(RESOURCES_FILE);
        const filtered = resources.filter(r => r.id !== parseInt(req.params.id));
        await writeFile(RESOURCES_FILE, filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ error: 'Failed to delete resource' });
    }
});

app.get('/api/quicklinks', async (req, res) => {
    try {
        const links = await readFile(QUICKACCESS_FILE);
        res.json(links);
    } catch (error) {
        console.error('Error reading quick links:', error);
        res.status(500).json({ error: 'Failed to read quick links' });
    }
});

app.post('/api/quicklinks', requireAuth, async (req, res) => {
    try {
        const links = await readFile(QUICKACCESS_FILE);
        links.push(req.body);
        await writeFile(QUICKACCESS_FILE, links);
        res.json({ success: true, link: req.body });
    } catch (error) {
        console.error('Error adding quick link:', error);
        res.status(500).json({ error: 'Failed to add quick link' });
    }
});

app.delete('/api/quicklinks/:id', requireAuth, async (req, res) => {
    try {
        const links = await readFile(QUICKACCESS_FILE);
        const filtered = links.filter(l => l.id !== parseInt(req.params.id));
        await writeFile(QUICKACCESS_FILE, filtered);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting quick link:', error);
        res.status(500).json({ error: 'Failed to delete quick link' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
