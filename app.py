"""
Site de IA para ajuda com lições e tarefas - Backend (FastAPI)

Como rodar:
    pip install fastapi uvicorn anthropic python-dotenv
    uvicorn app:app --reload

Crie um arquivo .env na mesma pasta com:
    ANTHROPIC_API_KEY=sua_chave_aqui
"""

import os

from anthropic import Anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

MODELO = os.getenv("MODELO_IA", "claude-sonnet-5-5")

INSTRUCOES_TUTOR = (
    "Você é um tutor paciente e amigável que ajuda estudantes com lições e tarefas. "
    "Explique passo a passo, em português, com linguagem simples e exemplos. "
    "Incentive o aluno a pensar: dê dicas e explique o raciocínio em vez de apenas "
    "entregar a resposta final. Se a pergunta não for sobre estudos, "
    "traga a conversa de volta ao aprendizado com gentileza."
)

app = FastAPI(title="Site de IA para Lições e Tarefas")

# Libera o frontend para conversar com a API (ajuste os domínios em produção)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

cliente = Anthropic()  # lê ANTHROPIC_API_KEY do ambiente


# ---------- Modelos de dados ----------
class Mensagem(BaseModel):
    papel: str  # "user" ou "assistant"
    conteudo: str


class PedidoChat(BaseModel):
    mensagem: str
    historico: list[Mensagem] = []


class RespostaChat(BaseModel):
    resposta: str


# ---------- Rotas ----------
@app.get("/")
def inicio():
    return {"status": "ok", "mensagem": "API do site de IA para lições funcionando!"}


@app.post("/chat", response_model=RespostaChat)
def chat(pedido: PedidoChat):
    if not pedido.mensagem.strip():
        raise HTTPException(status_code=400, detail="A mensagem não pode estar vazia.")

    mensagens = [{"role": m.papel, "content": m.conteudo} for m in pedido.historico]
    mensagens.append({"role": "user", "content": pedido.mensagem})

    try:
        retorno = cliente.messages.create(
            model=MODELO,
            max_tokens=1000,
            system=INSTRUCOES_TUTOR,
            messages=mensagens,
        )
    except Exception as erro:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar a IA: {erro}")

    texto = "".join(bloco.text for bloco in retorno.content if bloco.type == "text")
    return RespostaChat(resposta=texto)
