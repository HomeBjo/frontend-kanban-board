const STORAGE_URL = 'http://127.0.0.1:8000/task/';
const STORAGE_TOKEN = '968be1fc43a8a2ac028e6373b8fdde0257084f60';

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    
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
                <p>Priority: ${task.priority}</p>
                <button onclick="editTask(${task.id})">Edit</button>
                <button onclick="deleteTask(${task.id})">Delete</button>
                <div>
                    <h4>Subtasks:</h4>
                    ${task.subtasks.map(subtask => `
                        <div class="subtask">
                            <p>${subtask.value} - ${subtask.status ? 'Complete' : 'Incomplete'}</p>
                            <button onclick="openEditSubtaskModal(${task.id}, ${subtask.id}, '${subtask.value}', ${subtask.status})">EditSubtask</button>
                            <button onclick="deleteSubtask(${task.id}, ${subtask.id})">DeleteSubtask</button>
                        </div>
                    `).join('')}
                </div>
            `;
            tasksDiv.appendChild(taskElement);
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
        assign_to: null,
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
        `).join('') + '<button type="button" onclick="addSubtask()">Add Subtask</button>';
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
        <button type="button" onclick="removeSubtask(this)">Remove Subtask</button>
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
