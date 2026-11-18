# Site de IA para Lições e Tarefas

Site com um tutor de IA que ajuda estudantes com lições e tarefas, explicando passo a passo em vez de apenas entregar a resposta final.

## Tecnologias

- Python
- FastAPI (backend)
- Uvicorn (servidor)
- Anthropic API (IA)
- python-dotenv (variáveis de ambiente)

## Como rodar

1. Instale as dependências:

   ```
   pip install -r requirements.txt
   ```

2. Crie um arquivo `.env` na mesma pasta do `app.py` com a sua chave:

   ```
   ANTHROPIC_API_KEY=sua_chave_aqui
   ```

3. Inicie o servidor:

   ```
   uvicorn app:app --reload
   ```

4. Abra no navegador `http://127.0.0.1:8000/docs` para testar a API.

## Rotas da API

| Método | Rota    | Descrição                              |
|--------|---------|----------------------------------------|
| GET    | `/`     | Verifica se a API está funcionando     |
| POST   | `/chat` | Envia uma pergunta e recebe a resposta |

### Exemplo de requisição para `/chat`

```json
{
  "mensagem": "Como resolvo uma equação do 2º grau?",
  "historico": []
}
```

### Exemplo de resposta

```json
{
  "resposta": "Vamos por partes! Primeiro, identifique os valores de a, b e c..."
}
```

O campo `historico` é opcional e serve para manter o contexto da conversa. Cada item tem `papel` (`user` ou `assistant`) e `conteudo`.

## Estrutura do projeto

```
site-ia-licoes/
├── app.py
├── requirements.txt
├── README.md
├── .env            # chave secreta (não subir no Git)
└── .gitignore
```

## Configuração opcional

- `MODELO_IA`: no `.env`, permite trocar o modelo de IA usado (o padrão é `claude-sonnet-5-5`).

## Segurança

Nunca compartilhe o arquivo `.env` nem suba ele no Git. Adicione `.env` ao `.gitignore`.

## Próximos passos

- Criar a tela de chat (`chat.html`)
- Adicionar lista de tarefas
- Adicionar cadastro e login de usuários
