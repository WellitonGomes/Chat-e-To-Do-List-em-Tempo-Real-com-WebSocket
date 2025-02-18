# Chat e To-Do List em Tempo Real com WebSocket

Este é um sistema de chat simples utilizando WebSocket para comunicação em tempo real. O projeto é dividido em duas partes principais:

- **Frontend (Interface de Usuário):** A interface onde os usuários fazem login e interagem no chat.
- **Backend (Servidor WebSocket):** Um servidor WebSocket que gerencia as conexões dos clientes e retransmite as mensagens entre eles.

## Estrutura do Projeto

O projeto é composto pelos seguintes arquivos principais:

### Frontend
- `index.html`: Página HTML com a estrutura do formulário de login, chat e a tela de tarefas onde o coordenador pode mandar e visualizar mensagens e tarefas após logar.
- `chatroom.html`: Página HTML modificada para apenas receber as mensagens e tarefas enviadas pelo coordenador e confirmar a leitura e o cumprimento das tarefas.
- `style.css`: Estilos CSS para a interface do chat, login e tarefas.
- `chatRoom.css`: Estilos CSS para a interface de visualização das mensagens e do chat.
- `chat.js`: Lógica JavaScript para o funcionamento do chat e das tarefas, incluindo o gerenciamento e a conexão WebSocket.

### Backend
- `server.js`: Arquivo Node.js que inicializa o servidor WebSocket.
- `package.json`: Arquivo de configuração do npm, que gerencia dependências e scripts do projeto.
- `node_modules/`: Diretório com as dependências do Node.js.

---

## Detalhamento dos Arquivos

### `index.html`
Arquivo HTML que estrutura a página do chat, contendo:
- **Login:** Onde o usuário informa seu nome e função.
- **Chat:** Onde as mensagens são exibidas e o usuário pode digitar novas mensagens.
- **Tarefas:** Onde o usuário pode inserir tarefas direcionadas aos operadores.

### `style.css`
Arquivo CSS que define o estilo da interface:
- Estilo da página de login.
- Estilo da página do chat, incluindo mensagens de texto.
- Estilo da página de tarefas.
- Personalização dos botões e campos de entrada.

### `chat.js`
Arquivo JavaScript que gerencia a interação do usuário:
- Inicializa o WebSocket ao enviar o formulário de login.
- Envia mensagens e tarefas ao servidor WebSocket, que as retransmite para os outros usuários.
- Exibe o conteúdo das mensagens e tarefas na interface.
- Identifica se as mensagens foram lidas ou não.

### `server.js`
Arquivo Node.js que inicializa o servidor WebSocket:
- Utiliza a biblioteca `ws` para criar um servidor WebSocket.
- Escuta na porta do servidor Postgres.
- Ao receber uma mensagem de um cliente, salva a informação e retransmite para todos os clientes conectados.

### `package.json`
Arquivo de configuração do npm que gerencia as dependências e scripts de execução:
- `dotenv`: Carrega variáveis de ambiente definidas no arquivo `.env`.
- `ws`: Biblioteca para comunicação WebSocket.

**Scripts:**
- `start`: Roda o servidor em produção.
- `dev`: Roda o servidor em modo de desenvolvimento, monitorando alterações nos arquivos.

---

## Fluxo de Dados

1. **Conexão entre Frontend e WebSocket**: Quando o usuário entra no chat, o frontend se conecta ao servidor WebSocket.
2. **Envio de Mensagens e Tarefas**: O frontend envia os dados para o servidor WebSocket.
3. **Broadcast das Mensagens**: O servidor retransmite a mensagem para todos os clientes conectados.
4. **Exibição no Frontend**: As mensagens e tarefas recebidas são exibidas na interface, diferenciando se foram enviadas pelo usuário ou por outra pessoa.

---

## Melhorias Futuras
- **Autenticação de Usuários:** Implementar um sistema de login para que apenas usuários registrados possam acessar o chat.
- **Descrição no campo do operador:** Permitir que o operador defina como a tarefa foi resolvida.
- **Definição de estado das Tarefas:** Adicionar status para tarefas em andamento, em espera ou concluídas.
- **Definição de Urgência das Tarefas:** Permitir que os usuários definam a prioridade das tarefas.
- **Confirmação de Ação:** Adicionar uma notificação de confirmação ao concluir ou excluir uma tarefa ou mensagem.

---

## Problemas Conhecidos
- **Atualização das tarefas:** Quando uma tarefa é marcada como concluída pelo operador, ela não está sendo atualizada na tela do coordenador.

---

## Como Rodar o Projeto

1. Clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   ```
2. Acesse a pasta do projeto:
   ```bash
   cd nome-do-projeto
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   npm run dev
   ```
5. Acesse o frontend abrindo `index.html` em seu navegador.

---

## Contribuição
Se deseja contribuir para este projeto:
1. Faça um **fork** do repositório.
2. Crie uma **branch** para sua feature (`git checkout -b minha-feature`).
3. Commit suas alterações (`git commit -m 'Adicionando minha feature'`).
4. Faça um **push** para sua branch (`git push origin minha-feature`).
5. Abra um **Pull Request**.



