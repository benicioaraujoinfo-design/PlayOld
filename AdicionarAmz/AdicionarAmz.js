const campoPesquisa = document.getElementById("pesquisaAmigos");
const listaUsuarios = document.getElementById("listaUsuarios");
const estadoPesquisa = document.getElementById("estadoPesquisa");
const botaoLimpar = document.getElementById("limparPesquisa");
const listaPedidos = document.getElementById("listaPedidos");
const estadoPedidos = document.getElementById("estadoPedidos");
const listaAmigos = document.getElementById("listaAmigos");
const estadoAmigos = document.getElementById("estadoAmigos");
const fotoPadrao = "../imagens/gato.jpeg";

    let temporizadorPesquisa = null;
    let requisicaoAtual = null;

    function mostrarEstado(mensagem, tipo = "") {
        estadoPesquisa.textContent = mensagem;
        estadoPesquisa.className = tipo;
    }

    function limparResultados() {
        listaUsuarios.replaceChildren();
    }

    function criarCartaoUsuario(usuario) {
        const cartao = document.createElement("article");
        cartao.className = "cartaoUsuario";

        const foto = document.createElement("img");
        foto.className = "fotoResultado";
        foto.alt = `Foto de perfil de ${usuario.UsrName}`;
        foto.src = usuario.foto_perfil || fotoPadrao;

        // Se a foto cadastrada não carregar, tenta usar a imagem padrão.
        foto.addEventListener("error", () => {
            foto.src = fotoPadrao;
            foto.onerror = null;
        });

        const informacoes = document.createElement("div");
        informacoes.className = "informacoesUsuario";

        const nome = document.createElement("p");
        nome.className = "nomeUsuario";
        nome.textContent = usuario.UsrName;

        const subtitulo = document.createElement("p");
        subtitulo.className = "subtituloUsuario";
        subtitulo.textContent = "Usuário do PlayOld";

        informacoes.append(nome, subtitulo);

        const botao = document.createElement("button");
        botao.className = "botaoAdicionar";
        botao.type = "button";
        botao.textContent = "Enviar pedido de amizade";
        botao.title = "O envio de pedidos será ativado na próxima etapa";

        // A rota para enviar o pedido ainda será criada no servidor.
        
		botao.addEventListener("click", async () => {

			botao.disabled = true;
			botao.textContent = "Enviando...";

			try {

				const resposta = await fetch("/amizades/pedidos", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					credentials: "same-origin",
					body: JSON.stringify({
						IDdestinatario: usuario.IDusr
					})
				});

				const resultado = await resposta.json();

				if (!resposta.ok) {
					throw new Error(
						resultado.erro || "Não foi possível enviar o pedido."
					);
				}

				botao.textContent = "Pedido enviado";
				botao.classList.add("pedidoEnviado");

				mostrarEstado(resultado.mensagem);

			} catch (erro) {

				mostrarEstado(erro.message, "erro");

				botao.disabled = false;
				botao.textContent = "Enviar pedido de amizade";

			}

		});
		
        cartao.append(foto, informacoes, botao);
        return cartao;
    }

    async function pesquisarUsuarios(termo) {
        if (requisicaoAtual) {
            requisicaoAtual.abort();
        }

        if (termo.length < 2) {
            limparResultados();
            mostrarEstado(
                termo.length === 0
                    ? ""
                    : "Digite pelo menos 2 caracteres para pesquisar."
            );
            return;
        }

        requisicaoAtual = new AbortController();
        mostrarEstado("Pesquisando usuários...");
        limparResultados();

        try {
            const resposta = await fetch(
                `/usuarios/buscar?q=${encodeURIComponent(termo)}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    signal: requisicaoAtual.signal
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.mensagem || "Não foi possível pesquisar usuários."
                );
            }

            // Ignora resultados de uma pesquisa que já foi substituída.
            if (campoPesquisa.value.trim() !== termo) {
                return;
            }

            const usuarios = Array.isArray(resultado.usuarios)
                ? resultado.usuarios
                : [];

            if (usuarios.length === 0) {
                mostrarEstado("Nenhum usuário encontrado.");
                return;
            }

            mostrarEstado(
                usuarios.length === 1
                    ? "1 usuário encontrado."
                    : `${usuarios.length} usuários encontrados.`
            );

            const fragmento = document.createDocumentFragment();

            usuarios.forEach((usuario) => {
                fragmento.appendChild(criarCartaoUsuario(usuario));
            });

            listaUsuarios.appendChild(fragmento);

        } catch (erro) {
            if (erro.name === "AbortError") {
                return;
            }

            console.error("Erro ao pesquisar usuários:", erro);
            limparResultados();

            mostrarEstado(
                erro.message === "Failed to fetch"
                    ? "Não foi possível conectar ao servidor. Verifique se o PlayOld está aberto."
                    : erro.message,
                "erro"
            );
        }
    }

    campoPesquisa.addEventListener("input", () => {
        const termo = campoPesquisa.value.trim();

        botaoLimpar.style.display = termo ? "block" : "none";
        clearTimeout(temporizadorPesquisa);

        temporizadorPesquisa = setTimeout(() => {
            pesquisarUsuarios(termo);
        }, 300);
    });

    botaoLimpar.addEventListener("click", () => {
        campoPesquisa.value = "";
        botaoLimpar.style.display = "none";
        limparResultados();
        mostrarEstado("");
        campoPesquisa.focus();

        if (requisicaoAtual) {
            requisicaoAtual.abort();
        }
    });
    

/* =========================================
   PEDIDOS DE AMIZADE RECEBIDOS
========================================= */

function criarCartaoPedido(pedido) {
    const cartao = document.createElement("article");
    cartao.className = "cartaoPedido";

    const foto = document.createElement("img");
    foto.className = "fotoResultado";
    foto.alt = `Foto de perfil de ${pedido.UsrName}`;
    foto.src = pedido.foto_perfil || fotoPadrao;

    foto.addEventListener("error", () => {
        foto.onerror = null;
        foto.src = fotoPadrao;
    });

    const informacoes = document.createElement("div");
    informacoes.className = "informacoesUsuario";

    const nome = document.createElement("p");
    nome.className = "nomeUsuario";
    nome.textContent = pedido.UsrName;

    const subtitulo = document.createElement("p");
    subtitulo.className = "subtituloUsuario";
    subtitulo.textContent = "Enviou um pedido de amizade";

    informacoes.append(nome, subtitulo);

    const botoes = document.createElement("div");
    botoes.className = "botoesPedido";

    const botaoAceitar = document.createElement("button");
    botaoAceitar.type = "button";
    botaoAceitar.className = "botaoAceitar";
    botaoAceitar.textContent = "Aceitar";

    const botaoRecusar = document.createElement("button");
    botaoRecusar.type = "button";
    botaoRecusar.className = "botaoRecusar";
    botaoRecusar.textContent = "Recusar";

    botaoAceitar.addEventListener("click", () => {
        responderPedido(pedido.IDpedido, "aceitar", cartao);
    });

    botaoRecusar.addEventListener("click", () => {
        responderPedido(pedido.IDpedido, "recusar", cartao);
    });

    botoes.append(botaoAceitar, botaoRecusar);
    cartao.append(foto, informacoes, botoes);

    return cartao;
}

async function carregarPedidos() {
    estadoPedidos.textContent = "Carregando pedidos...";
    estadoPedidos.className = "";
    listaPedidos.replaceChildren();

    try {
        const resposta = await fetch("/amizades/pedidos/recebidos", {
            method: "GET",
            credentials: "same-origin"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível carregar os pedidos."
            );
        }

        const pedidos = Array.isArray(resultado.pedidos)
            ? resultado.pedidos
            : [];

        if (pedidos.length === 0) {
            estadoPedidos.textContent = "Você não tem pedidos de amizade pendentes.";
            return;
        }

        estadoPedidos.textContent =
            pedidos.length === 1
                ? "Você recebeu 1 pedido de amizade."
                : `Você recebeu ${pedidos.length} pedidos de amizade.`;

        const fragmento = document.createDocumentFragment();

        pedidos.forEach((pedido) => {
            fragmento.appendChild(criarCartaoPedido(pedido));
        });

        listaPedidos.appendChild(fragmento);

    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
        estadoPedidos.textContent = erro.message;
        estadoPedidos.className = "erro";
    }
}

async function responderPedido(IDpedido, acao, cartao) {
    const botoes = cartao.querySelectorAll("button");

    botoes.forEach((botao) => {
        botao.disabled = true;
    });

    estadoPedidos.textContent =
        acao === "aceitar"
            ? "Aceitando pedido..."
            : "Recusando pedido...";

    try {
        const resposta = await fetch(
            `/amizades/pedidos/${IDpedido}/${acao}`,
            {
                method: "POST",
                credentials: "same-origin"
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível responder ao pedido."
            );
        }

        estadoPedidos.textContent =
            resultado.mensagem || "Pedido atualizado com sucesso.";

        await carregarPedidos();

    } catch (erro) {
        console.error("Erro ao responder ao pedido:", erro);
        estadoPedidos.textContent = erro.message;
        estadoPedidos.className = "erro";

        botoes.forEach((botao) => {
            botao.disabled = false;
        });
    }
}

// Carrega os pedidos assim que a página é aberta.
carregarPedidos();


/* =========================================
   LISTA DE AMIGOS
========================================= */

function criarCartaoAmigo(amigo) {
    const cartao = document.createElement("article");
    cartao.className = "cartaoAmigo";
    
    cartao.setAttribute("role", "link");
	cartao.setAttribute("tabindex", "0");
	cartao.setAttribute(
		"aria-label",
		`Abrir perfil de ${amigo.UsrName}`
	);
	cartao.title = `Ver perfil de ${amigo.UsrName}`;

	function abrirPerfilAmigo() {
		window.location.href =
			`../Perfil/Perfil.html?id=${encodeURIComponent(amigo.IDusr)}`;
	}

	cartao.addEventListener("click", (evento) => {
		if (evento.target.closest(".botaoCancelarAmizade")) {
			return;
		}

		abrirPerfilAmigo();
	});

	cartao.addEventListener("keydown", (evento) => {
		if (
			evento.target === cartao &&
			(evento.key === "Enter" || evento.key === " ")
		) {
			evento.preventDefault();
			abrirPerfilAmigo();
		}
	});

    const foto = document.createElement("img");
    foto.className = "fotoResultado";
    foto.src = amigo.foto_perfil || fotoPadrao;
    foto.alt = `Foto de perfil de ${amigo.UsrName}`;

    // Usa a foto padrão caso a imagem do amigo não carregue.
    foto.addEventListener("error", () => {
        foto.onerror = null;
        foto.src = fotoPadrao;
    });

    const informacoes = document.createElement("div");
    informacoes.className = "informacoesUsuario";

    const nome = document.createElement("p");
    nome.className = "nomeUsuario";
    nome.textContent = amigo.UsrName;

    const subtitulo = document.createElement("p");
    subtitulo.className = "subtituloUsuario";
    subtitulo.textContent = "Amigo do PlayOld";

    
	informacoes.append(nome, subtitulo);

	const botaoCancelar = document.createElement("button");
	botaoCancelar.type = "button";
	botaoCancelar.className = "botaoCancelarAmizade";
	botaoCancelar.textContent = "Cancelar amizade";

	botaoCancelar.addEventListener("click", async () => {

		const confirmou = confirm(
			`Deseja realmente cancelar a amizade com ${amigo.UsrName}?`
		);

		if (!confirmou) {
			return;
		}

		botaoCancelar.disabled = true;
		botaoCancelar.textContent = "Cancelando...";

		try {

			const resposta = await fetch(
				`/amizades/${amigo.IDusr}`,
				{
					method: "DELETE",
					credentials: "same-origin"
				}
			);

			const resultado = await resposta.json();

			if (!resposta.ok) {
				throw new Error(
					resultado.erro || "Não foi possível cancelar a amizade."
				);
			}

			estadoAmigos.textContent = resultado.mensagem;

			// Atualiza a lista após o cancelamento.
			await carregarAmigos();

		} catch (erro) {

			console.error("Erro ao cancelar amizade:", erro);

			estadoAmigos.textContent = erro.message;
			estadoAmigos.className = "erro";

			botaoCancelar.disabled = false;
			botaoCancelar.textContent = "Cancelar amizade";

		}

	});

	cartao.append(foto, informacoes, botaoCancelar);

	return cartao;

}

async function carregarAmigos() {
    estadoAmigos.textContent = "Carregando amigos...";
    estadoAmigos.className = "";
    listaAmigos.replaceChildren();

    try {
        const resposta = await fetch("/amizades", {
            method: "GET",
            credentials: "same-origin"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível carregar seus amigos."
            );
        }

        const amigos = Array.isArray(resultado.amigos)
            ? resultado.amigos
            : [];

        if (amigos.length === 0) {
            estadoAmigos.textContent =
                "Você ainda não tem amigos. Pesquise jogadores abaixo para adicioná-los.";
            return;
        }

        estadoAmigos.textContent =
            amigos.length === 1
                ? "Você tem 1 amigo."
                : `Você tem ${amigos.length} amigos.`;

        const fragmento = document.createDocumentFragment();

        amigos.forEach((amigo) => {
            fragmento.appendChild(criarCartaoAmigo(amigo));
        });

        listaAmigos.appendChild(fragmento);

    } catch (erro) {
        console.error("Erro ao carregar amigos:", erro);
        estadoAmigos.textContent = erro.message;
        estadoAmigos.className = "erro";
    }
}

// Carrega a lista quando a página é aberta.
carregarAmigos();
