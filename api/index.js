import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch(e) {
        res.status(500).send('Error: ' + e.message);
    }
}
