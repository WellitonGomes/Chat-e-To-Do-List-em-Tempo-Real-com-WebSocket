// Função para carregar as mensagens armazenadas no localStorage
const loadMessages = () => {
    const storedMessages = localStorage.getItem("messages");
    return storedMessages ? JSON.parse(storedMessages) : [];
};

// Quando a conexão WebSocket é aberta
const socket = new WebSocket("ws://localhost:3006");

socket.onopen = () => {
    console.log("Conectado ao servidor WebSocket");
};

// Quando recebe novas mensagens do WebSocket
socket.onmessage = (event) => {
    const data = JSON.parse(event.data); 
    
    if(data.alteracao){
        listTasks()
    }

    if (data.action === "taskCompleted") {
        const taskId = data.taskId;
        const taskElement = document.getElementById(`task-${taskId}`);

        if (taskElement) {
            taskElement.remove(); // Remove a task da interface
            console.log(`Task ${taskId} removida da tela.`);
        }
    }

    if (data.action === "messageRead") {
        // Se a ação for 'messageRead', exibe o alerta
        const storedMessages = loadMessages();
        const message = storedMessages.find(msg => msg.id === data.idMensagem);

        if (message) {
            alert(`A mensagem com o conteúdo: "${message.content}" foi marcada como lida. `);
        }
    }

    // Carregar e exibir mensagens do WebSocket
    const storedMessages = loadMessages();
    const updatedMessages = [...storedMessages, ...data.messages]; // Junta as mensagens antigas com as novas
    localStorage.setItem("messages", JSON.stringify(updatedMessages)); // Atualiza o localStorage

    // Exibe as mensagens atualizadas
    displayMessages(updatedMessages);
};


// Função para marcar como lida a mensagem
const handleConfirmRead = async (idMensagem) => {
    try {
        const response = await fetch("http://localhost:3006/api/confirmarLeitura", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idMensagem })
        });

        if (response.ok) {
            // Obtém a mensagem do localStorage
            const storedMessages = loadMessages();
            const message = storedMessages.find(msg => msg.id === idMensagem);

            // Exibe o alerta com o conteúdo da mensagem
            if (message) {
                // alert(`Mensagem lida com sucesso! Conteúdo: "${message.content}"`);
            }

            // Atualiza a mensagem no localStorage
            const updatedMessages = storedMessages.map(message =>
                message.id === idMensagem ? { ...message, confirmado: true } : message
            );
            localStorage.setItem("messages", JSON.stringify(updatedMessages)); // Atualiza o localStorage

            // Exibe as mensagens novamente
            displayMessages(updatedMessages);

            // Envia a notificação para todos os clientes (inclusive o index.html) sobre a leitura da mensagem
            socket.send(JSON.stringify({ action: "messageRead", idMensagem }));
        } else {
            alert("Erro ao confirmar leitura.");
        }
    } catch (error) {
        console.error("Erro ao confirmar leitura:", error);
    }
};

// Função para exibir as mensagens
const displayMessages = (messages) => {
    const chatMessages = document.querySelector("#chatMessages");
    chatMessages.innerHTML = ""; // Limpa mensagens antigas

    // Verifica se a página atual é a index.html
    const isIndexPage = window.location.pathname.includes("index.html");

    messages.slice(-3).forEach(message => { // Exibe as 3 últimas mensagens
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");

        // Nome do remetente
        const senderElement = document.createElement("div");
        senderElement.classList.add("message--sender");
        senderElement.textContent = message.usuario;

        // Conteúdo da mensagem
        const contentElement = document.createElement("div");
        contentElement.classList.add("message--content");
        contentElement.textContent = message.content;

        // Data e hora da mensagem
        const dateElement = document.createElement("div");
        dateElement.classList.add("message--date");

        const date = message.createdat ? new Date(message.createdat) : null;
        const formattedDate = date && !isNaN(date)
            ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
            : "Data inválida";

        dateElement.textContent = formattedDate;

        // Anexa todos os elementos à mensagem
        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        messageElement.appendChild(dateElement);

        // Exibe o status de "confirmado"
        if (message.confirmado !== null && message.confirmado === true) {
            const statusElement = document.createElement("div");
            statusElement.classList.add("message--status");

            // Adiciona o ícone de confirmação (lido)
            const checkIcon = document.createElement("i");
            checkIcon.classList.add("fa-solid", "fa-check");
            checkIcon.setAttribute("title", "Mensagem lida com sucesso");
            statusElement.appendChild(checkIcon);

            messageElement.appendChild(statusElement);
        } else if (isIndexPage) {
            // Adiciona o ícone de "não lido" apenas na index.html
            const statusElement = document.createElement("div");
            statusElement.classList.add("message--status");

            // Adiciona o ícone de "não lido"
            const unreadIcon = document.createElement("i");
            unreadIcon.classList.add("fa-solid", "fa-arrows-rotate", "fa-spin");
            unreadIcon.setAttribute("title", "Mensagem não lida");
            statusElement.appendChild(unreadIcon);

            messageElement.appendChild(statusElement);
        }

        // Adicionar o botão de "Confirmar Leitura" (apenas se não for a index.html)
        if (!isIndexPage && message.confirmado === null) {
            const confirmButton = document.createElement("button");
            confirmButton.classList.add("confirm-button");

            const iconElement = document.createElement("i");
            iconElement.classList.add("fa-regular", "fa-thumbs-up");

            confirmButton.appendChild(iconElement);
            confirmButton.appendChild(document.createTextNode(" Lido"));
            confirmButton.addEventListener("click", () => handleConfirmRead(message.id));

            messageElement.appendChild(confirmButton);
        }

        chatMessages.appendChild(messageElement);
    });
};

// Função para enviar mensagens
const handleMessageSubmit = async (event) => {
    event.preventDefault();

    const usuario = localStorage.getItem("username") || "Anônimo"; // Se não houver usuário logado, será enviado como "Anônimo"
    const messageInput = document.querySelector("#messageInput");

    const message = {
        id: generateUniqueId(),
        usuario: usuario,
        content: messageInput.value,
        createdat: new Date().toISOString(), // Armazena a data de criação
        confirmado: null // Inicializa como nulo
    };

    try {
        const response = await fetch("http://localhost:3006/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar a mensagem para o servidor.");
        }

        messageInput.value = ""; // Limpa o campo de entrada

        // Atualiza as mensagens no localStorage e exibe
        const storedMessages = loadMessages();
        storedMessages.push(message); // Adiciona a nova mensagem
        localStorage.setItem("messages", JSON.stringify(storedMessages)); // Atualiza o localStorage

        // Exibe as mensagens novamente
        displayMessages(storedMessages);

        // Exibe o alerta de sucesso
        alert("Mensagem enviada com sucesso!");

    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
    }
};

// Função para lidar com o login do usuário
const handleLogin = (event) => {
    event.preventDefault();

    const usuario = document.querySelector("#username").value;
    localStorage.setItem("username", usuario);

    // Ocultar a seção de login e exibir a seção de chat
    document.querySelector(".login").style.display = "none";
    document.querySelector(".chat").style.display = "flex";
};

// Função para gerar IDs únicos
const generateUniqueId = () => {
    return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
};

// Adicionar eventos aos formulários
if (document.querySelector(".login__form")) {
    document.querySelector(".login__form").addEventListener("submit", handleLogin);
    document.querySelector(".chat__form").addEventListener("submit", handleMessageSubmit);
}

// Carregar mensagens ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
    const storedMessages = loadMessages();
    displayMessages(storedMessages); // Exibe as mensagens armazenadas no localStorage

    // Verifica se está na página `index.html`
    if (window.location.pathname.includes("index.html")) {
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data); // Parseia a resposta recebida do servidor

            // Se a ação for 'messageRead', exibe o alerta na página index
            if (data.action === "messageRead") {
                // Procura a mensagem pelo ID
                const storedMessages = loadMessages();
                const message = storedMessages.find(msg => msg.id === data.idMensagem);

                if (message) {
                    alert(`A mensagem com o conteúdo: "${message.content}" foi marcada como lida.`);
                } else {
                    alert("Mensagem não encontrada no armazenamento local.");
                }
            }

            // Carregar e exibir mensagens do WebSocket
            const storedMessages = loadMessages();
            const updatedMessages = [...storedMessages, ...data.messages]; // Junta as mensagens antigas com as novas
            localStorage.setItem("messages", JSON.stringify(updatedMessages)); // Atualiza o localStorage

            // Exibe as mensagens
            displayMessages(updatedMessages);
        };
    }

    // Configuração do modal de histórico
    const btnViewHistory = document.getElementById('btnViewHistory');
    const historyModal = document.getElementById('historyModal');  // Modal de histórico
    const closeModalBtn = document.getElementById('closeModal');  // Botão de fechar modal
    const historyMessages = document.getElementById('historyMessages');  // Onde o histórico será exibido

    // Função para abrir o modal e mostrar o histórico de mensagens
    btnViewHistory.addEventListener('click', async () => {
        historyModal.style.display = 'flex';  // Exibe o modal (flex para centralizar)

        try {
            // Carrega as mensagens do servidor
            const response = await fetch("http://localhost:3006/api/messages");
            if (response.ok) {
                const messages = await response.json(); // Define a variável 'messages'
                console.log("Mensagens recebidas:", messages); // Verifica as mensagens

                historyMessages.innerHTML = '';  // Limpa qualquer conteúdo anterior

                // Itera sobre as mensagens e as exibe no modal
                messages.forEach(msg => {
                    const li = document.createElement('li');

                    // Adiciona uma classe ao elemento <li>
                    li.classList.add('mensagens-historico');

                    // Verifica se a propriedade 'createdat' existe e formata a data
                    const date = msg.createdat ? new Date(msg.createdat) : null;
                    const formattedDate = date && !isNaN(date)
                        ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                        : "Data inválida";

                    console.log("Data formatada:", formattedDate); // Verifica a data formatada

                    // Exibe o usuário, conteúdo e data da mensagem
                    li.innerHTML = `${msg.usuario}:<br>`;  // Quebra a linha após o nome do usuário

                    // Exibe o conteúdo da mensagem
                    li.innerHTML += `${msg.content}<br>`;  // Quebra a linha após o conteúdo da mensagem

                    // Exibe a data da mensagem
                    li.innerHTML += `${formattedDate}`; 
                    historyMessages.appendChild(li);
                });
            } else {
                alert("Erro ao carregar o histórico.");
            }
        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
            alert("Erro ao buscar mensagens do histórico.");
        }
    });

    // Função para fechar o modal
    closeModalBtn.addEventListener('click', () => {
        historyModal.style.display = 'none';  // Esconde o modal
    });

    // Fechar o modal clicando fora da área do conteúdo
    window.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });
});

const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');

// Função para listar as tasks
const listTasks = async () => {
    try {
        const response = await fetch('http://localhost:3006/api/tasks');
        console.log(response)
        const tasks = await response.json();
        taskList.innerHTML = tasks.map(task => {
            const date = task.createdat ? new Date(task.createdat) : null;
            
            const formattedDate = date && !isNaN(date)
                ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                : "Data inválida";

            return `
                <div class="form-three">
                    <li class="task-list" id="task-${task.id}" style="color: ${task.completed ? 'green' : 'red'};">
                        <strong>${task.usuario}</strong>: ${task.content} 
                        - ${task.completed ? '<span style="color: green;">Tarefa Concluída</span>' : '<span style="color: red;">Pendente</span>'}
                    </li>
                    <div class="task-date">Criada em: ${formattedDate}</div>
                    <div class="btn">
                        <button class="btn-completeTask" onclick="markTaskCompleted(${task.id})" title="marcar tarefa como concluída">
                            <i class="fa-regular fa-circle-check"></i>
                        </button>
                        <button class="btn-deleteTask" onclick="deleteTask(${task.id})" title="deletar tarefa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar as tasks:', error);
    }
};


taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = localStorage.getItem("username"); // Usuário armazenado ao fazer login
    if (!usuario) {
        alert("Você precisa estar logado para criar uma tarefa!");
        return;
    }

    const content = document.getElementById('content').value;

    const newTask = {
        usuario,
        content
    };

    try {
        const response = await fetch('http://localhost:3006/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        });

        const task = await response.json();
        insertMessage('Nova task criada:', task);
        listTasks();

        document.getElementById('content').value = ""; // Limpa o campo de input de conteúdo
    } catch (error) {
        console.error('Erro ao criar task:', error);
    }
});


const markTaskCompleted = async (id) => {
    try {
        const response = await fetch(`http://localhost:3006/api/tasks/${id}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            throw new Error(`Erro ao atualizar task: ${response.statusText}`);
        }

        const updatedTask = await response.json();

        insertMessage("Tarefa concluída com sucesso!");

        deleteTask(id)

            
        // Atualiza a lista de tasks após marcar a tarefa como concluída
        listTasks();
    } catch (error) {
        console.error('Erro ao concluir task:', error);
    }
};


const deleteTask = async (id) => {
    try {
        const response = await fetch(`http://localhost:3006/api/tasks/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Erro ao deletar task: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Task deletada:', result);

        // Atualiza a lista de tasks após deletar
        listTasks();
    } catch (error) {
        console.error('Erro ao deletar task:', error);
    }
};


// Função para inserir mensagens dentro da div com id "alert"
const insertMessage = (message, timeout = 3000) => {
    // Cria um novo elemento h1
    const h1 = document.createElement('h1');
    
    // Define o conteúdo da mensagem
    h1.textContent = message;
    
    // Seleciona a div com o id "alert"
    const alertDiv = document.getElementById('alert');
    
    // Adiciona o novo elemento h1 à div
    alertDiv.appendChild(h1);

    // Faz a mensagem desaparecer após o tempo especificado (em milissegundos)
    setTimeout(() => {
        alertDiv.removeChild(h1);
    }, timeout);
};


document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.querySelector(".login");
    const cardSendSection = document.querySelector(".card-send");

    // Oculta o card-send quando a página carrega
    cardSendSection.style.display = "none";

    const handleLogin = (event) => {
        event.preventDefault();

        const usuario = document.querySelector("#username").value;
        localStorage.setItem("username", usuario);

        // Oculta a seção de login e exibe a seção de card-send
        loginSection.style.display = "none";
        cardSendSection.style.display = "block"; // Ou "flex", dependendo do layout
    };

    if (document.querySelector(".login__form")) {
        document.querySelector(".login__form").addEventListener("submit", handleLogin);
    }
});



document.addEventListener('DOMContentLoaded', function () {

    const btnChat = document.getElementById('btn-chat');
    const btnTask = document.getElementById('btn-task');

    const containerTask = document.getElementById('container_task');
    const chatSection = document.querySelector('.chat'); // Seção do chat


    // Inicializa com a seção de tarefas visível e o chat oculto
    containerTask.classList.add('sumir');


    btnChat.addEventListener('click', function () {
        // Esconde a seção de tarefas e mostra o chat
        containerTask.style.display = 'none'; // Mostra a seção de tarefas
        chatSection.style.display = 'block'; // Garante que a seção de chat apareça

    });

    // Evento para mostrar a seção de tarefas e esconder o chat
    btnTask.addEventListener('click', function () {
        // Esconde o card-send (chat) e mostra a seção de tarefas
        containerTask.style.display = 'block'; // Esconde o container de tarefas
        chatSection.style.display = 'none';   // Esconde o chat
    });

});




// Carregar as tasks ao carregar a página
listTasks();