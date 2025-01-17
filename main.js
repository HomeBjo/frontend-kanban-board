const STORAGE_URL = 'http://127.0.0.1:8000/task/';
const USER_URL = 'http://127.0.0.1:8000/api/users/';
const STORAGE_TOKEN = '968be1fc43a8a2ac028e6373b8fdde0257084f60';
let usersArray = [];
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadUsersMenu();
    allUsersEdit();

    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('subtaskForm').addEventListener('submit', handleSubtaskSubmit);
});

function loadTasks() {
    fetch(STORAGE_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${STORAGE_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const tasksDiv = document.getElementById('tasks');
        tasksDiv.innerHTML = '';
        data.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task';
            taskElement.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p>Priorität: ${task.priority}</p>
                <button onclick="editTask(${task.id})">Bearbeiten</button>
                <button onclick="deleteTask(${task.id})">Löschen</button>
                <div>
                    <h4>Benutzer:</h4>
                    <div id="users${task.id}"></div>
                    <h4>Unteraufgaben:</h4>
                    ${task.subtasks.map(subtask => `
                        <div class="subtask">
                            <p>${subtask.value} - ${subtask.status ? 'Erledigt' : 'Nicht erledigt'}</p>
                            <button onclick="openEditSubtaskModal(${task.id}, ${subtask.id}, '${subtask.value}', ${subtask.status})">Unteraufgabe bearbeiten</button>
                            <button onclick="deleteSubtask(${task.id}, ${subtask.id})">Unteraufgabe löschen</button>
                        </div>
                    `).join('')}
                </div>
            `;
            tasksDiv.appendChild(taskElement);
            loadUsers(task.id);
        });
    });
}

function handleTaskSubmit(event) {
    event.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const priority = document.getElementById('priority').value;
    const subtasks = Array.from(document.getElementsByClassName('subtask-input'))
        .map(input => ({ value: input.value, status: true, id: input.dataset.id ? parseInt(input.dataset.id) : null }));

    const taskData = {
        title,
        description,
        due_date: new Date().toISOString().split('T')[0],
        priority,
        assign_to: document.getElementById('userList').value,
        category: "",
        created_at: new Date().toISOString().split('T')[0],
        author: 1,
        subtasks
    };

    const requestOptions = {
        method: taskId ? 'PATCH' : 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${STORAGE_TOKEN}`
        },
        body: JSON.stringify(taskData)
    };

    fetch(`${STORAGE_URL}${taskId ? `${taskId}/` : ''}`, requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.detail) {
                console.error('Error:', data.detail);
                alert(`Error: ${data.detail}`);
            } else {
                loadTasks();
                document.getElementById('taskForm').reset();
            }
        })
        .catch(error => console.error('Error:', error));
}

function editTask(taskId) {
    fetch(`${STORAGE_URL}${taskId}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${STORAGE_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(task => {
        document.getElementById('taskId').value = task.id;
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('priority').value = task.priority;
        document.getElementById('subtasks').innerHTML = task.subtasks.map(subtask => `
            <input type="text" class="subtask-input" data-id="${subtask.id}" value="${subtask.value}">
        `).join('') + '<button type="button" onclick="addSubtask()">Unteraufgabe hinzufügen</button>';
    })
    .catch(error => console.error('Error:', error));
}

function deleteTask(taskId) {
    fetch(`${STORAGE_URL}${taskId}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Token ${STORAGE_TOKEN}`
        }
    })
    .then(() => loadTasks())
    .catch(error => console.error('Error:', error));
}

function handleSubtaskSubmit(event) {
    event.preventDefault();
    const subtaskTaskId = document.getElementById('subtaskTaskId').value;
    const subtaskId = document.getElementById('subtaskId').value;
    const subtaskValue = document.getElementById('subtaskValue').value;
    const subtaskStatus = document.getElementById('subtaskStatus').checked;

    fetch(`${STORAGE_URL}${subtaskTaskId}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${STORAGE_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(task => {
        const updatedSubtasks = task.subtasks.map(subtask => 
            subtask.id === parseInt(subtaskId) 
            ? { ...subtask, value: subtaskValue, status: subtaskStatus } 
            : subtask
        );

        const updatedTask = {
            ...task,
            subtasks: updatedSubtasks
        };

        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Token ${STORAGE_TOKEN}`);
        myHeaders.append("Content-Type", "application/json");

        const requestOptions = {
            method: "PATCH",
            headers: myHeaders,
            body: JSON.stringify(updatedTask),
            redirect: "follow"
        };

        fetch(`${STORAGE_URL}${subtaskTaskId}/subtasks/${subtaskId}/`, requestOptions)
            .then(response => response.json())
            .then(result => {
                console.log(result);
                closeSubtaskModal();
                loadTasks();
            })
            .catch(error => console.error('Error:', error));
    })
    .catch(error => console.error('Error:', error));
}

function deleteSubtask(taskId, subtaskId) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Token ${STORAGE_TOKEN}`);

    const requestOptions = {
        method: 'DELETE',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch(`${STORAGE_URL}${taskId}/subtasks/${subtaskId}/`, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            loadTasks();
        })
        .catch(error => console.error('Error:', error));
}

function openEditSubtaskModal(taskId, subtaskId, subtaskValue, subtaskStatus) {
    document.getElementById('subtaskTaskId').value = taskId;
    document.getElementById('subtaskId').value = subtaskId;
    document.getElementById('subtaskValue').value = subtaskValue;
    document.getElementById('subtaskStatus').checked = subtaskStatus;
    openSubtaskModal();
}

function addSubtask() {
    const subtaskDiv = document.createElement('div');
    subtaskDiv.className = 'subtask-input-container';
    subtaskDiv.innerHTML = `
        <input type="text" class="subtask-input">
        <button type="button" onclick="removeSubtask(this)">Unteraufgabe entfernen</button>
    `;
    document.getElementById('subtasks').appendChild(subtaskDiv);
}

function removeSubtask(button) {
    const subtaskDiv = button.parentNode;
    document.getElementById('subtasks').removeChild(subtaskDiv);
}

function openSubtaskModal() {
    document.getElementById('subtaskModal').style.display = 'block';
}

function closeSubtaskModal() {
    document.getElementById('subtaskModal').style.display = 'none';
}

function loadUsers(taskId) {
    fetch(USER_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${STORAGE_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const userListDiv = document.getElementById(`users${taskId}`);
        userListDiv.innerHTML = `
            <label for="userList${taskId}">Benutzer auswählen:</label>
            <select id="userList${taskId}">
                ${data.map(user => `
                    <option value="${user.id}">${user.username}</option>
                `).join('')}
            </select>
        `;
    })
    .catch(error => console.error('Error:', error));
}
function loadUsersMenu() {
    fetch(USER_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${STORAGE_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => {
        usersArray = data; // Store users in the array
        const userListSelect = document.getElementById('userList');
        userListSelect.innerHTML = usersArray.map(user => `
            <option value="${user.id}">${user.username}</option>
        `).join('');
        allUsersEdit();
    })
   
    .catch(error => console.error('Error:', error));
}

/////// anlegen
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
});

function handleUserSubmit(event) {
    event.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const passwordConfirm = document.getElementById('confirmPassword').value;

    const userData = {
        username,
        password,
        password_confirm: passwordConfirm
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    };

    fetch('http://127.0.0.1:8000/register/', requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Error: ${data.error}`);
            } else {
                alert('User created successfully');
                document.getElementById('userForm').reset();
                loadUsersMenu();
            }
        })
        .catch(error => console.error('Error:', error));
}

function allUsersEdit() {
    const allUsersContainer = document.getElementById('allUsersContainer');
    allUsersContainer.innerHTML = ''; // Clear previous content

    usersArray.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user';
        userElement.innerHTML = `
            <p>ID: ${user.id}</p>
            <p>Username: ${user.username}</p>
            <button onclick="editUser(${user.id})">Bearbeiten</button>
            <button onclick="deleteUser(${user.id})">Löschen</button>
        `;
        allUsersContainer.appendChild(userElement);
    });
}

////*css*/`
function editUser(userId) {
    const user = usersArray.find(user => user.id === userId);
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editPassword').value = ''; // Leeres Passwortfeld

    openEditUserModal();
}

// Funktion zum Öffnen des Modals
function openEditUserModal() {
    document.getElementById('editUserModal').style.display = 'block';
}

// Funktion zum Schließen des Modals
function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
}

// Event-Listener für das Bearbeiten-Formular
document.getElementById('editUserForm').addEventListener('submit', handleUserEditSubmit);

function handleUserEditSubmit(event) {
    event.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value;
    const password = document.getElementById('editPassword').value;

    const userData = {
        username,
    };

    if (password) {
        userData.password = password;
    }

    const requestOptions = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${STORAGE_TOKEN}`
        },
        body: JSON.stringify(userData)
    };

    fetch(`http://127.0.0.1:8000/user/${userId}/`, requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Error: ${data.error}`);
            } else {
                alert('User updated successfully');
                closeEditUserModal();
                loadUsersMenu();
            }
        })
        .catch(error => console.error('Error:', error));
}

function deleteUser(userId) {
    const requestOptions = {
        method: 'DELETE',
        headers: {
            'Authorization': `Token ${STORAGE_TOKEN}`
        }
    };

    fetch(`http://127.0.0.1:8000/user/${userId}/`, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            alert('User deleted successfully');
            loadUsersMenu();
        })
        .catch(error => console.error('Error:', error));
}

