export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const webhookUrl = process.env.BITRIX_WEBHOOK;

    if (!webhookUrl) {
        res.status(500).json({ error: 'BITRIX_WEBHOOK env var not set' });
        return;
    }

    // 🔥 ГЛАВНЫЙ endpoint — сразу готовые пользователи проекта
    if (req.query.action === 'getProjectUsersFull') {
        const groupId = req.query.groupId;

        try {
            // 1. Получаем участников группы
            const groupRes = await fetch(
                webhookUrl + 'sonet_group.user.get.json?ID=' + groupId
            );
            const groupData = await groupRes.json();
            const members = groupData.result || [];

            if (!members.length) {
                return res.status(200).json({ result: [] });
            }

            // 2. Собираем ID пользователей
            const ids = members.map(m => m.USER_ID);

            // 3. Получаем пользователей ПО ОДНОМУ (фикс бага Bitrix)
            const users = [];

            for (const id of ids) {
                const r = await fetch(
                    webhookUrl + 'user.get.json?ID=' + id
                );
                const d = await r.json();

                if (d.result && d.result[0]) {
                    users.push(d.result[0]);
                }
            }
            // 4. Нормализуем ответ (чистый массив)
            const result = users.map(u => ({
                id: u.ID,
                name: (u.NAME || '') + ' ' + (u.LAST_NAME || '')
            }));

            res.status(200).json({ result });

        } catch (e) {
            res.status(500).json({ error: e.message });
        }

        return;
    }

    // HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Участники проекта</title>
<script src="https://api.bitrix24.com/api/v1/"></script>

<style>
body {
    font-family: Arial, sans-serif;
    padding: 16px;
    margin: 0;
}
#status { color: #666; }
li { padding: 4px 0; }
.error { color: red; }
</style>
</head>

<body>
<h3>Участники проекта</h3>
<div id="status">Загрузка...</div>
<ul id="userList"></ul>

<script>
BX24.init(function () {
    var placementInfo = BX24.placement.info();
    var options = placementInfo.options || {};
    var taskId = options.taskId || options.ID;

    if (!taskId) {
        document.getElementById('status').innerHTML = '<span class="error">Нет taskId</span>';
        return;
    }

    // Получаем groupId
    BX24.callMethod('tasks.task.get', {
        taskId: taskId,
        select: ['GROUP_ID']
    }, function (res) {

        if (res.error()) {
            document.getElementById('status').innerHTML = '<span class="error">' + res.error() + '</span>';
            return;
        }

        var groupId = res.data().task.groupId;

        if (!groupId) {
            document.getElementById('status').innerHTML = '<span class="error">Нет проекта</span>';
            return;
        }

        // 🔥 ОДИН запрос вместо двух
        fetch('/api/index?action=getProjectUsersFull&groupId=' + groupId)
        .then(r => r.json())
        .then(data => {
            var users = data.result || [];
            var list = document.getElementById('userList');
            var status = document.getElementById('status');

            if (!users.length) {
                status.textContent = 'Нет участников';
                return;
            }

            status.textContent = 'Найдено: ' + users.length;

            users.forEach(function (u) {
                var li = document.createElement('li');
                li.textContent = u.name || u.id;
                list.appendChild(li);
            });
        })
        .catch(err => {
            document.getElementById('status').innerHTML =
                '<span class="error">' + err.message + '</span>';
        });
    });
});
</script>
</body>
</html>`);
}
