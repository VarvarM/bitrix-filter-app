BX24.init(function() {
    BX24.callMethod('placement.bind', {
        PLACEMENT: 'TASK_VIEW_TAB',
        HANDLER: 'https://bitrix-filter-app.vercel.app/api/index',
        TITLE: 'Участники проекта'
    }, function(result) {
        console.log('placement.bind result:', result.data(), result.error());
    });

    var placement = BX24.placement.info();
    var groupId = placement.options ? placement.options.GROUP_ID : null;

    window.allUsers = [];

    if (!groupId) {
        document.getElementById('userList').innerHTML =
            '<div style="padding:8px;color:#999">Плейсмент зарегистрирован. Откройте любую задачу проекта — появится вкладка "Участники проекта"</div>';
        return;
    }

    document.getElementById('search').style.display = 'block';
    loadGroupMembers(groupId);
});

function renderUsers(users) {
    var list = document.getElementById('userList');
    list.innerHTML = users.map(function(u) {
        return '<div class="user-item" onclick="selectUser(' + u.id + ', \'' + 
               u.name.trim() + '\')">' + u.name.trim() + '</div>';
    }).join('');
}

function filterUsers() {
    var query = document.getElementById('search').value.toLowerCase();
    var filtered = window.allUsers.filter(function(u) {
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
