function getAppSid() {
    var params = new URLSearchParams(window.location.search);
    return params.get('APP_SID');
}

BX24.init(function() {
    var appSid = getAppSid();
    console.log('APP_SID:', appSid);
    
    var placement = BX24.placement.info();
    console.log('placement info:', JSON.stringify(placement));
    
    window.allUsers = [];
    
    var options = placement.options || {};
    var taskId = options.taskId || options.TASK_ID || null;
    var groupId = options.groupId || options.GROUP_ID || null;
    
    console.log('taskId:', taskId, 'groupId:', groupId);
    
    if (!groupId && taskId) {
        BX24.callMethod('tasks.task.get', {
            taskId: taskId,
            select: ['GROUP_ID']
        }, function(result) {
            if (result.error()) {
                document.getElementById('userList').innerHTML = 
                    '<div style="padding:8px;color:red">Ошибка получения задачи: ' + result.error() + '</div>';
                return;
            }
            var task = result.data().task;
            groupId = task.groupId;
            console.log('got groupId from task:', groupId);
            if (groupId && groupId != '0') {
                loadGroupMembers(groupId);
            } else {
                document.getElementById('userList').innerHTML = 
                    '<div style="padding:8px;color:#999">Задача не привязана к проекту</div>';
            }
        });
    } else if (groupId && groupId != '0') {
        loadGroupMembers(groupId);
    } else {
        document.getElementById('userList').innerHTML = 
            '<div style="padding:8px;color:#999">Откройте задачу внутри проекта</div>';
    }
});

function loadGroupMembers(groupId) {
    var webhookUrl = 'https://inshkola.bitrix24.ru/rest/YOUR_WEBHOOK_TOKEN/';
    
    fetch(webhookUrl + 'sonet_group.user.get.json?ID=' + groupId)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            console.log('sonet response:', data);
            if (data.error) {
                document.getElementById('userList').innerHTML = 
                    '<div style="padding:8px;color:red">Ошибка: ' + data.error_description + '</div>';
                return;
            }
            var users = data.result;
            if (!users || users.length === 0) {
                document.getElementById('userList').innerHTML = 
                    '<div style="padding:8px;color:#999">Участники не найдены</div>';
                return;
            }
            window.allUsers = users.map(function(u) {
                return {
                    id: u.USER_ID,
                    name: ((u.NAME || '') + ' ' + (u.LAST_NAME || '')).trim()
                };
            });
            document.getElementById('search').style.display = 'block';
            renderUsers(window.allUsers);
        });
}

function renderUsers(users) {
    var list = document.getElementById('userList');
    if (!users || users.length === 0) {
        list.innerHTML = '<div style="padding:8px;color:#999">Участники не найдены</div>';
        return;
    }
    list.innerHTML = users.map(function(u) {
        return '<div class="user-item" onclick="selectUser(' + u.id + ', \'' + 
               u.name + '\')">' + u.name + '</div>';
    }).join('');
}

function filterUsers() {
    var query = document.getElementById('search').value.toLowerCase();
    var filtered = (window.allUsers || []).filter(function(u) {
        return u.name.toLowerCase().indexOf(query) !== -1;
    });
    renderUsers(filtered);
}

function selectUser(userId, userName) {
    BX24.placement.call('setResponsible', { userId: userId }, function() {
        document.querySelectorAll('.user-item').forEach(function(el) {
            el.classList.remove('selected');
        });
        event.target.classList.add('selected');
    });
}
