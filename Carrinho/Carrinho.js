const cards = document.getElementById("cards");

function formatarPreco(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "Preço indisponível";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function criarCard(jogo) {
    const card = document.createElement("div");
    card.classList.add("card");

    const imagem = document.createElement("img");
    imagem.src = jogo.img1 || "../imagens/gatinhoFeliz.jpg";
    imagem.alt = `Capa de ${jogo.Game_Name}`;

    imagem.addEventListener("error", function () {
        imagem.src = "../imagens/gatinhoFeliz.jpg";
        imagem.onerror = null;
    });

    const nome = document.createElement("h2");
    nome.textContent = jogo.Game_Name;

    const preco = document.createElement("h3");
    const precoOriginal = Number(jogo.preco);
    const precoFinal = Number(jogo.preco_final);
    const desconto = Number(jogo.desconto) || 0;

    if (jogo.preco_final != null && Number.isFinite(precoFinal)) {
        if (
            desconto > 0 &&
            Number.isFinite(precoOriginal) &&
            precoOriginal > precoFinal
        ) {
            preco.textContent =
                `${formatarPreco(precoFinal)} ` +
                `(${desconto}% de desconto)`;
        } else {
            preco.textContent = formatarPreco(precoFinal);
        }
    } else {
        preco.textContent = formatarPreco(jogo.preco);
    }

	const botaoComprar = document.createElement("button");

	botaoComprar.type = "button";
	botaoComprar.classList.add("agora");
	botaoComprar.textContent = "Comprar agora";

	botaoComprar.addEventListener("click", function () {
		if (!jogo.IDgme) {
			alert("Não foi possível identificar o jogo.");
			return;
		}

		window.location.href =
			`../Comprar/Comprar.html?id=${encodeURIComponent(jogo.IDgme)}`;
	});
    
	const botaoRemover = document.createElement("button");

	botaoRemover.type = "button";
	botaoRemover.classList.add("remover");
	botaoRemover.textContent = "Remover do carrinho";

	botaoRemover.addEventListener("click", async function () {
		if (!jogo.IDgme) {
			alert("Não foi possível identificar o jogo.");
			return;
		}

		botaoRemover.disabled = true;
		botaoRemover.textContent = "Removendo...";

		try {
			const resposta = await fetch(
				`/carrinho/${encodeURIComponent(jogo.IDgme)}`,
				{
					method: "DELETE",
					credentials: "same-origin"
				}
			);

			const dados = await resposta.json();

			if (!resposta.ok || !dados.sucesso) {
				throw new Error(
					dados.mensagem || "Não foi possível remover o jogo."
				);
			}

			await carregarCarrinho();

		} catch (erro) {
			console.error("Erro ao remover jogo:", erro);

			alert(erro.message || "Ocorreu um erro ao remover o jogo.");

			botaoRemover.disabled = false;
			botaoRemover.textContent = "Remover do carrinho";
		}
	});


    card.append(
        imagem,
        nome,
        preco,
        botaoComprar,
        botaoRemover
    );

    return card;
}

async function carregarCarrinho() {
    cards.replaceChildren();

    const mensagem = document.createElement("p");
    mensagem.style.color = "white";
    mensagem.textContent = "Carregando carrinho...";

    cards.appendChild(mensagem);

    try {
        const resposta = await fetch("/carrinho", {
            method: "GET",
            credentials: "same-origin"
        });

        const dados = await resposta.json();

        if (resposta.status === 401) {
            cards.replaceChildren();

            mensagem.textContent =
                "Você precisa entrar na sua conta para visualizar o carrinho.";

            cards.appendChild(mensagem);
            return;
        }

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || "Não foi possível carregar o carrinho."
            );
        }

        if (!Array.isArray(dados.jogos) || dados.jogos.length === 0) {
            cards.replaceChildren();

            mensagem.textContent = "Seu carrinho está vazio.";
            cards.appendChild(mensagem);
            return;
        }

        const fragmento = document.createDocumentFragment();

        dados.jogos.forEach(function (jogo) {
            const card = criarCard(jogo);
            fragmento.appendChild(card);
        });

        cards.replaceChildren(fragmento);

    } catch (erro) {
        console.error("Erro ao carregar o carrinho:", erro);

        cards.replaceChildren();

        mensagem.textContent =
            "Não foi possível carregar os jogos. Tente novamente.";

        cards.appendChild(mensagem);
    }
}

carregarCarrinho();