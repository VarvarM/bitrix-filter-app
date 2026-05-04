export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Если запрос на получение участников группы
    if (req.method === 'GET' && req.query.action === 'getGroupUsers') {
        const groupId = req.query.groupId;
        const webhookUrl = process.env.BITRIX_WEBHOOK;
        
        try {
            const response = await fetch(webhookUrl + 'sonet_group.user.get.json?ID=' + groupId);
            const data = await response.json();
            res.status(200).json(data);
        } catch(e) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    // Иначе возвращаем index.html
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const html = readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}
