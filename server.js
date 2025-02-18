const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Substitui bodyParser.json()

// Configuração do Pool de Conexão com o PostgreSQL
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "chatdb",
    password: "jkwelliton",
    port: 5432,
});

// Criando o servidor WebSocket
const wss = new WebSocket.Server({ noServer: true });

// Função para enviar mensagens para todos os clientes conectados
const broadcastMessage = async (message, action) => {
    try {
        const result = await pool.query("SELECT * FROM messages ORDER BY createdat DESC LIMIT 3");
        const latestMessages = result.rows;

        // Envia para todos os clientes WebSocket
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ action, messages: latestMessages, message }));
            }
        });
    } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
    }
};



// Rota para obter as mensagens do banco de dados
app.get("/api/messages", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM messages ORDER BY createdat ASC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao carregar mensagens" });
    }
});

// Rota para enviar uma nova mensagem
app.post("/api/messages", async (req, res) => {
    const { usuario, content, completed } = req.body;

    if (!usuario || !content) {
        return res.status(400).json({ error: "Usuário e conteúdo são obrigatórios" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO messages (usuario, content, confirmado) VALUES ($1, $2, $3) RETURNING *",
            [usuario, content, completed]
        );
        console.log("Resultado da inserção:", result.rows);

        const savedMessage = result.rows[0];
        broadcastMessage(savedMessage, 'newMessage');  // Envia para todos os clientes via WebSocket

        res.status(201).json(savedMessage); // Retorna a mensagem inserida
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao salvar a mensagem" });
    }
});

// Rota para confirmar a leitura de uma mensagem
app.post("/api/confirmarLeitura", async (req, res) => {
    const { idMensagem } = req.body;
    if (!idMensagem) {
        return res.status(400).json({ error: "ID da mensagem é obrigatório" });
    }

    try {
        const result = await pool.query(
            "UPDATE messages SET confirmado = TRUE WHERE id = $1 RETURNING *",
            [idMensagem]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Mensagem não encontrada" });
        }

        const updatedMessage = result.rows[0];
        broadcastMessage(updatedMessage, 'messageRead');  // Envia a mensagem atualizada para todos os clientes via WebSocket

        res.status(200).json(updatedMessage); // Retorna a mensagem atualizada
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao confirmar leitura" });
    }
});

// Rota para criar uma nova task
app.post("/api/tasks", async (req, res) => {
    const { usuario, content } = req.body;

    console.log("Dados recebidos para task:", req.body);

    if (!usuario || !content) {
        return res.status(400).json({ error: "Usuário e conteúdo são obrigatórios" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO tasks (usuario, content) VALUES ($1, $2) RETURNING *",
            [usuario, content]
        );
        wss.clients.forEach((client) => {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({alteracao : true}));
                }
            });
        });
        const savedTask = result.rows[0];
        res.status(201).json(savedTask);
    } catch (error) {
        console.error("Erro ao salvar a task:", error);
        res.status(500).json({ error: "Erro ao salvar a task. Detalhes: " + error.message });
    }
});

// Rota para listar todas as tasks
app.get("/api/tasks", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tasks ORDER BY createdat ASC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao carregar as tasks" });
    }
});

// Rota para marcar uma task como concluída
app.put("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "UPDATE tasks SET completed = TRUE WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Task não encontrada" });
        }
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({alteracao : true}));
            }
        });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar a task" });
    }
});

// Rota para deletar uma task
app.delete("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Task não encontrada" });
        }

        res.json({ message: "Task deletada com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao deletar a task" });
    }
});

// Iniciar o servidor HTTP
const PORT = 3006;
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Associar WebSocket ao servidor HTTP
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});

// Evento de conexão do WebSocket
// wss.on('connection', async (ws) => {
//     await pool.query('alteracoes_db')
//     console.log('Novo cliente conectado');

//     ws.on('message', (message) => {
//         const data = JSON.parse(message);

//         if (data.action === "taskUpdated") {
//             // Notificar todos os clientes sobre a atualização
//             wss.clients.forEach((client) => {
//                 if (client.readyState === WebSocket.OPEN) {
//                     client.send(JSON.stringify({ action: "taskUpdated" }));
//                 }
//             });
//         }
//     });
// });

wss.on('connection', async (ws) => {
    console.log('Novo cliente conectado');
    await pool.query('listen alteracoes_db')
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.action === "taskUpdated") {
            // Notificar todos os clientes sobre a atualização
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: "taskUpdated" }));
                }
            });
        }
    });
});

pool.on('notification', (msg) => {
    console.log("teve alteração nessa bosta")
})


// Conectar ao banco de dados
pool.connect((err, client, release) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.stack);
    } else {
        console.log("Conectado ao banco de dados");
    }
});
//pool.onmessage