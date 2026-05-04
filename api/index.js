export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.query.action === 'getUsers') {
    const ids = req.query.ids; // строка "102,5,8"
    const webhookUrl = process.env.BITRIX_WEBHOOK;
    try {
        const response = await fetch(webhookUrl + 'user.get.json?ID=' + ids);
        const data = await response.json();
        res.status(200).json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
    return;
}

    
    // API: получить участников группы
    if (req.query.action === 'getGroupUsers') {
        const groupId = req.query.groupId;
        const webhookUrl = process.env.BITRIX_WEBHOOK;
        if (!webhookUrl) {
            res.status(500).json({ error: 'BITRIX_WEBHOOK env var not set' });
            return;
        }
        try {
            const response = await fetch(webhookUrl + 'sonet_group.user.get.json?ID=' + groupId);
            const data = await response.json();
            res.status(200).json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    // Главная страница — HTML прямо в коде, без readFileSync
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
            background: #fff;
        }
        h3 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #333;
        }
        #status {
            color: #888;
            font-size: 14px;
        }
        #userList {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        #userList li {
            padding: 6px 0;
            border-bottom: 1px solid #eee;
            font-size: 14px;
            color: #222;
        }
        .error {
            color: red;
            font-size: 13px;
        }
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
            var taskId = options.taskId || (placementInfo.options && placementInfo.options.ID);

            if (!taskId) {
                document.getElementById('status').innerHTML = '<span class="error">Не удалось получить ID задачи.</span>';
                return;
            }

            // Получаем задачу, чтобы узнать groupId
            BX24.callMethod('tasks.task.get', { taskId: taskId, select: ['GROUP_ID'] }, function (taskResult) {
                if (taskResult.error()) {
                    document.getElementById('status').innerHTML = '<span class="error">Ошибка получения задачи: ' + taskResult.error() + '</span>';
                    return;
                }

                var task = taskResult.data().task;
                var groupId = task && task.groupId;

                if (!groupId) {
                    document.getElementById('status').innerHTML = '<span class="error">Задача не привязана к проекту.</span>';
                    return;
                }

                // Запрашиваем участников проекта через наш бэкенд
                fetch('/api/index?action=getGroupUsers&groupId=' + groupId)
    .then(function (r) { return r.json(); })
    .then(function (data) {
        var members = data.result || [];
        var statusEl = document.getElementById('status');
        var list = document.getElementById('userList');

        if (!members.length) {
            statusEl.textContent = 'Участников не найдено.';
            return;
        }

        // Собираем массив USER_ID
        var userIds = members.map(function (m) { return m.USER_ID; });

        // Второй запрос — получаем имена
        BX24.callMethod('user.get', { ID: userIds }, function (userResult) {
            if (userResult.error()) {
                statusEl.innerHTML = '<span class="error">Ошибка получения пользователей: ' + userResult.error() + '</span>';
                return;
            }

            var users = userResult.data();
            statusEl.textContent = 'Найдено участников: ' + users.length;

            users.forEach(function (u) {
                var li = document.createElement('li');
                var name = ((u.NAME || '') + ' ' + (u.LAST_NAME || '')).trim();
                li.textContent = name || u.ID || '—';
                list.appendChild(li);
            });
        });
    })
    .catch(function (err) {
        document.getElementById('status').innerHTML = '<span class="error">Ошибка: ' + err.message + '</span>';
    });
            });
        });
    </script>
</body>
</html>`);
}
