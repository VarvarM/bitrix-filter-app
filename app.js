BX24.init(function() {
    var placement = BX24.placement.info();
    var groupId = placement.options ? placement.options.GROUP_ID : null;

    if (!groupId) {
        document.getElementById('userList').innerHTML = 
            '<div style="padding:8px;color:red">Откройте приложение из карточки проекта</div>';
        return;
    }

    BX24.callMethod(
        'socialnetwork.api.workgroup.getusers',
        { groupId: groupId, filterId: 'A' },
        function(result) {
            if (result.error()) {
                document.getElementById('userList').innerHTML = 
                    '<div style="padding:8px;color:red">Ошибка: ' + result.error() + '</div>';
                return;
            }

            var users = result.data();
            if (!users || users.length === 0) {
                document.getElementById('userList').innerHTML = 
                    '<div style="padding:8px;color:#999">Участники не найдены</div>';
                return;
            }

            window.allUsers = users.map(function(u) {
                return {
                    id: u.USER_ID || u.ID,
                    name: (u.NAME || '') + ' ' + (u.LAST_NAME || '')
                };
            });

            renderUsers(window.allUsers);
        }
    );
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
