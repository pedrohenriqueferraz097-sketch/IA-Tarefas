/* =====================================================
   Task AI - funcionalidades
   Tudo roda no navegador, sem servidor.
   ===================================================== */

// Espera o HTML carregar por completo antes de rodar o código
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Atalho para pegar elementos ---------- */
  const $ = (id) => document.getElementById(id);

  /* ---------- Funções de armazenamento seguras ----------
     Se o navegador bloquear o localStorage, o site continua funcionando. */
  function salvar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* ignora */ }
  }
  function carregar(chave, padrao) {
    try {
      const v = localStorage.getItem(chave);
      return v ? JSON.parse(v) : padrao;
    } catch (e) { return padrao; }
  }

  /* =====================================================
     1. MENU HAMBÚRGUER (celular)
     ===================================================== */
  const menu = $("menu");
  $("menu-toggle").addEventListener("click", () => menu.classList.toggle("aberto"));
  // Fecha o menu ao clicar em um link
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => menu.classList.remove("aberto"))
  );

  /* =====================================================
     2. MODO ESCURO
     ===================================================== */
  const botaoTema = $("tema-btn");
  function aplicarTema(escuro) {
    document.body.classList.toggle("escuro", escuro);
    botaoTema.textContent = escuro ? "☀️" : "🌙";
    salvar("taskai-escuro", escuro);
  }
  aplicarTema(carregar("taskai-escuro", false));
  botaoTema.addEventListener("click", () =>
    aplicarTema(!document.body.classList.contains("escuro"))
  );

  /* =====================================================
     3. BOTÃO "ME MOTIVE!" (mensagem na página inicial)
     ===================================================== */
  const frasesMotivacao = [
    "Você não precisa ser perfeito, só constante! 💪",
    "Cada página estudada te deixa mais perto do objetivo. 📖",
    "Hoje é um ótimo dia para aprender algo novo! 🌟",
    "Errar faz parte de aprender. Continue tentando! 🚀",
    "Pequenos passos todos os dias levam longe. 👣"
  ];
  $("btn-motivacao").addEventListener("click", () => {
    const i = Math.floor(Math.random() * frasesMotivacao.length);
    $("mensagem-motivacao").textContent = frasesMotivacao[i];
  });

  /* =====================================================
     4. LISTA DE TAREFAS (salva no navegador)
     ===================================================== */
  let tarefas = carregar("taskai-tarefas", []);   // [{id, texto, feita}]
  const listaEl = $("lista-tarefas");

  function desenharTarefas() {
    listaEl.innerHTML = "";
    tarefas.forEach((t) => {
      const li = document.createElement("li");
      if (t.feita) li.classList.add("concluida");

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = t.feita;
      check.addEventListener("change", () => {
        t.feita = check.checked;
        salvar("taskai-tarefas", tarefas);
        desenharTarefas();
      });

      // textContent evita inserir HTML malicioso
      const texto = document.createElement("span");
      texto.textContent = t.texto;
      texto.addEventListener("click", () => check.click());

      const remover = document.createElement("button");
      remover.className = "btn-remover";
      remover.textContent = "🗑️";
      remover.setAttribute("aria-label", "Remover tarefa");
      remover.addEventListener("click", () => {
        tarefas = tarefas.filter((x) => x.id !== t.id);
        salvar("taskai-tarefas", tarefas);
        desenharTarefas();
      });

      li.append(check, texto, remover);
      listaEl.appendChild(li);
    });

    const pendentes = tarefas.filter((t) => !t.feita).length;
    $("contador-tarefas").textContent =
      `${pendentes} pendente(s) de ${tarefas.length} tarefa(s)`;
  }

  $("form-tarefa").addEventListener("submit", (e) => {
    e.preventDefault();                       // impede a página de recarregar
    const campo = $("input-tarefa");
    const texto = campo.value.trim();
    if (texto === "") {
      $("erro-tarefa").textContent = "Digite uma tarefa antes de adicionar.";
      return;
    }
    $("erro-tarefa").textContent = "";
    tarefas.push({ id: Date.now(), texto: texto, feita: false });
    salvar("taskai-tarefas", tarefas);
    campo.value = "";
    desenharTarefas();
  });

  $("limpar-concluidas").addEventListener("click", () => {
    tarefas = tarefas.filter((t) => !t.feita);
    salvar("taskai-tarefas", tarefas);
    desenharTarefas();
  });

  desenharTarefas();

  /* =====================================================
     5. CALCULADORA DE MÉDIA
     ===================================================== */
  const camposNotas = document.querySelectorAll(".nota");
  const resultadoMedia = $("resultado-media");

  $("btn-calcular").addEventListener("click", () => {
    const notas = [];
    for (const campo of camposNotas) {
      if (campo.value.trim() === "") continue;        // ignora campos vazios
      const n = parseFloat(campo.value);
      if (isNaN(n) || n < 0 || n > 10) {
        resultadoMedia.className = "resultado reprovado";
        resultadoMedia.textContent = "Use apenas notas entre 0 e 10.";
        return;
      }
      notas.push(n);
    }
    if (notas.length === 0) {
      resultadoMedia.className = "resultado reprovado";
      resultadoMedia.textContent = "Digite pelo menos uma nota.";
      return;
    }

    const media = notas.reduce((soma, n) => soma + n, 0) / notas.length;
    let situacao, classe;
    if (media >= 7)      { situacao = "Aprovado! 🎉"; classe = "aprovado"; }
    else if (media >= 5) { situacao = "Recuperação. Você consegue! 📚"; classe = "recuperacao"; }
    else                 { situacao = "Abaixo da média. Vamos estudar mais! 💪"; classe = "reprovado"; }

    resultadoMedia.className = "resultado " + classe;
    resultadoMedia.textContent = `Média: ${media.toFixed(1)} → ${situacao}`;
  });

  $("btn-limpar-notas").addEventListener("click", () => {
    camposNotas.forEach((c) => (c.value = ""));
    resultadoMedia.className = "resultado";
    resultadoMedia.textContent = "Preencha as notas (0 a 10).";
  });

  /* =====================================================
     6. TEMPORIZADOR POMODORO
     ===================================================== */
  let duracao = 25 * 60;       // segundos do modo atual
  let restante = duracao;
  let intervalo = null;        // guarda o setInterval
  const tempoEl = $("tempo");
  const statusEl = $("status-pomodoro");

  function mostrarTempo() {
    const m = String(Math.floor(restante / 60)).padStart(2, "0");
    const s = String(restante % 60).padStart(2, "0");
    tempoEl.textContent = `${m}:${s}`;
    document.title = `${m}:${s} | Task AI`;
  }

  function parar() {
    clearInterval(intervalo);
    intervalo = null;
  }

  $("btn-iniciar").addEventListener("click", () => {
    if (intervalo) return;                 // já está rodando
    statusEl.textContent = "Foque! Você está indo bem. 🔥";
    intervalo = setInterval(() => {
      restante--;
      mostrarTempo();
      if (restante <= 0) {
        parar();
        statusEl.textContent = "Tempo esgotado! Bom trabalho! 🎉";
        document.title = "Task AI";
        alert("⏰ O tempo acabou! Faça uma pausa ou comece de novo.");
      }
    }, 1000);
  });

  $("btn-pausar").addEventListener("click", () => {
    if (!intervalo) return;
    parar();
    statusEl.textContent = "Pausado. ⏸️";
  });

  $("btn-reiniciar").addEventListener("click", () => {
    parar();
    restante = duracao;
    statusEl.textContent = "";
    mostrarTempo();
    document.title = "Task AI | Seu assistente de estudos";
  });

  // Abas "Foco" e "Pausa"
  document.querySelectorAll(".aba").forEach((aba) => {
    aba.addEventListener("click", () => {
      document.querySelectorAll(".aba").forEach((a) => a.classList.remove("ativa"));
      aba.classList.add("ativa");
      parar();
      duracao = parseInt(aba.dataset.minutos, 10) * 60;
      restante = duracao;
      statusEl.textContent = "";
      mostrarTempo();
    });
  });

  mostrarTempo();

  /* =====================================================
     7. DICAS DE ESTUDO (com filtro por categoria)
     ===================================================== */
  const dicas = [
    { cat: "foco", texto: "Deixe o celular em outro cômodo enquanto estuda." },
    { cat: "foco", texto: "Use a técnica Pomodoro: 25 minutos de foco e 5 de pausa." },
    { cat: "foco", texto: "Estude a matéria mais difícil quando sua energia estiver alta." },
    { cat: "organizacao", texto: "Anote as datas de provas e trabalhos em um calendário." },
    { cat: "organizacao", texto: "Separe 10 minutos à noite para planejar o dia seguinte." },
    { cat: "organizacao", texto: "Divida trabalhos grandes em pequenas tarefas." },
    { cat: "memoria", texto: "Explique a matéria com suas palavras, como se ensinasse alguém." },
    { cat: "memoria", texto: "Faça resumos e mapas mentais em vez de só reler o texto." },
    { cat: "memoria", texto: "Revise o conteúdo 1 dia, 1 semana e 1 mês depois de estudar." }
  ];
  let categoriaAtual = "todas";
  let ultimaDica = -1;

  document.querySelectorAll(".filtro").forEach((botao) => {
    botao.addEventListener("click", () => {
      document.querySelectorAll(".filtro").forEach((b) => b.classList.remove("ativo"));
      botao.classList.add("ativo");
      categoriaAtual = botao.dataset.categoria;
      ultimaDica = -1;
      mostrarDica();
    });
  });

  function mostrarDica() {
    const lista = categoriaAtual === "todas"
      ? dicas
      : dicas.filter((d) => d.cat === categoriaAtual);
    let i;
    do {                                   // evita repetir a mesma dica
      i = Math.floor(Math.random() * lista.length);
    } while (lista.length > 1 && i === ultimaDica);
    ultimaDica = i;
    $("texto-dica").textContent = "💡 " + lista[i].texto;
  }
  $("btn-dica").addEventListener("click", mostrarDica);

  /* =====================================================
     8. FORMULÁRIO DE CONTATO COM VALIDAÇÃO
     ===================================================== */
  function erroCampo(idCampo, idErro, mensagem) {
    $(idErro).textContent = mensagem;
    $(idCampo).classList.toggle("invalido", mensagem !== "");
    return mensagem === "";                // true = campo válido
  }

  $("form-contato").addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = $("nome").value.trim();
    const email = $("email").value.trim();
    const msg = $("mensagem").value.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // O "&" simples garante que TODAS as validações rodem e mostrem seus erros
    const ok =
      erroCampo("nome", "erro-nome", nome.length < 2 ? "Digite seu nome (mínimo 2 letras)." : "") &
      erroCampo("email", "erro-email", !regexEmail.test(email) ? "Digite um e-mail válido." : "") &
      erroCampo("mensagem", "erro-mensagem", msg.length < 10 ? "A mensagem precisa ter pelo menos 10 caracteres." : "");

    if (ok) {
      $("sucesso-form").textContent = `Obrigado, ${nome}! Sua mensagem foi registrada. ✅`;
      $("form-contato").reset();
    } else {
      $("sucesso-form").textContent = "";
    }
  });

  /* =====================================================
     9. BOTÃO "VOLTAR AO TOPO" E ANO NO RODAPÉ
     ===================================================== */
  $("btn-topo").addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
  $("ano").textContent = new Date().getFullYear();

  /* =====================================================
     10. ANIMAÇÃO DE ENTRADA AO ROLAR A PÁGINA
     ===================================================== */
  const elementos = document.querySelectorAll("[data-animar]");
  if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver((itens) => {
      itens.forEach((item) => {
        if (item.isIntersecting) {
          item.target.classList.add("visivel");
          observador.unobserve(item.target);
        }
      });
    }, { threshold: 0.15 });
    elementos.forEach((el) => observador.observe(el));
  } else {
    // Navegadores antigos: mostra tudo de uma vez
    elementos.forEach((el) => el.classList.add("visivel"));
  }
});