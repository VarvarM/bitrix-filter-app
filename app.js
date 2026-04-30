var groupId = null;
var allUsers = [];
var selectedUsers = [];

BX24.init(function() {
    // Получаем ID текущей группы/проекта
    var placement = BX24.placement.info();
    groupId = placement.options.GROUP_ID;

    if (!groupId) {
        document.getElementById('userList').innerHTML = 'Ошибка: проект не найден';
        return;
    }

    loadGroupMembers();
});

function loadGroupMembers() {
    BX24.callMethod(
        'socialnetwork.api.workgroup.getusers',
        { groupId: groupId },
        function(result) {
            if (result.error()) {
                document.getElementById('userList').innerHTML = 'Ошибка загрузки участников';
                return;
            }

            var users = result.data();
            allUsers = users.map(function(u) {
                return {
                    id: u.ID,
                    name: u.NAME + ' ' + u.LAST_NAME
                };
            });

            renderUsers(allUsers);
        }
    );
}

function renderUsers(users) {
    var list = document.getElementById('userList');
    if (users.length === 0) {
        list.innerHTML = '<div style="padding:8px;color:#999">Участники не найдены</div>';
        return;
    }

    list.innerHTML = users.map(function(u) {
        var isSelected = selectedUsers.indexOf(u.id) !== -1;
        return '<div class="user-item ' + (isSelected ? 'selected' : '') + '" ' +
               'onclick="toggleUser(' + u.id + ', \'' + u.name + '\')">' +
               u.name + '</div>';
    }).join('');
}

function filterUsers() {
    var query = document.getElementById('search').value.toLowerCase();
    var filtered = allUsers.filter(function(u) {
        return u.name.toLowerCase().indexOf(query) !== -1;
    });
    renderUsers(filtered);
}

function toggleUser(userId, userName) {
    var idx = selectedUsers.indexOf(userId);
    if (idx === -1) {
        selectedUsers.push(userId);
    } else {
        selectedUsers.splice(idx, 1);
    }
    BX24.placement.call('setResponsible', { userId: userId });
    renderUsers(allUsers);
}
