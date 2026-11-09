const capasJogos = document.querySelector("#capasJogos");
const nomesJogos = document.querySelector("#nomesJogos");
const quantidadeJogos = document.querySelector("#quantidadeJogos");
const precoOriginal = document.querySelector("#precoOriginal");
const desconto = document.querySelector("#desconto");
const precoFinal = document.querySelector("#precoFinal");
const linhaDesconto = document.querySelector("#linhaDesconto");
const nomeComprador = document.querySelector("#nomeComprador");
const botaoComprar = document.querySelector("#botaoComprar");
const mensagemErro = document.querySelector("#mensagemErro");
const areaCompra = document.querySelector("#areaCompra");
const compraConcluida = document.querySelector("#compraConcluida");
const nomeUsuario = document.querySelector("#nomeUsuario");
const tituloCompra = document.querySelector("#tituloCompra");
const textoSucesso = document.querySelector("#textoSucesso");
let jogosDoCarrinho = [];

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function mostrarErro(texto) {
    mensagemErro.textContent = texto;
    mensagemErro.style.display = "block";
}
function ocultarErro() {
    mensagemErro.textContent = "";
    mensagemErro.style.display = "none";
}
function calcularPrecoFinal(jogo) {
    const preco = Number(jogo.preco) || 0;
    const porcentagem = Math.min(100, Math.max(0, Number(jogo.desconto) || 0));
    return Math.round((preco * (1 - porcentagem / 100) + Number.EPSILON) * 100) / 100;
}

async function carregarUsuario() {
    try {
        const resposta = await fetch("/usuario");
        const resultado = await resposta.json();

        if (resposta.status === 401) {
            window.location.href = "../Login/Login.html";
            return;
        }

        if (resposta.ok && resultado.usuario) {
            nomeComprador.value = resultado.usuario.UsrName || "";
        }
    } catch (erro) {
        console.error("Não foi possível carregar o usuário:", erro);
    }
}

async function carregarCarrinho() {
    try {
        const resposta = await fetch("/carrinho");
        const resultado = await resposta.json();
        if (resposta.status === 401) {
            window.location.href = "../Login/Login.html";
            return;
        }
        if (!resposta.ok || !Array.isArray(resultado.jogos)) {
            throw new Error(resultado.mensagem || "Não foi possível carregar o carrinho.");
        }
        jogosDoCarrinho = resultado.jogos;
        if (jogosDoCarrinho.length === 0) {
            window.location.href = "../Carrinho/Carrinho.html";
            return;
        }
        desenharResumo();
        botaoComprar.disabled = false;
    } catch (erro) {
        console.error(erro);
        capasJogos.textContent = "Não foi possível carregar os jogos do carrinho.";
        mostrarErro("Não foi possível carregar os jogos. Volte ao carrinho e tente novamente.");
    }
}

function desenharResumo() {
    capasJogos.innerHTML = "";
    nomesJogos.textContent = jogosDoCarrinho.map(jogo => jogo.Game_Name).join(", ");
    quantidadeJogos.textContent = jogosDoCarrinho.length === 1 ? "1 jogo na compra" : `${jogosDoCarrinho.length} jogos na compra`;
    // Apenas as três primeiras capas são exibidas; todos os jogos continuam na compra.
    jogosDoCarrinho.slice(0, 3).forEach((jogo, indice) => {
        const imagem = document.createElement("img");
        imagem.className = "capaSobreposta";
        imagem.src = jogo.img1 || "../imagens/semImagem.png";
        imagem.alt = `Capa de ${jogo.Game_Name}`;
        imagem.loading = "lazy";
        imagem.onerror = () => { imagem.onerror = null; imagem.src = "../imagens/semImagem.png"; };
        imagem.style.zIndex = String(3 - indice);
        capasJogos.appendChild(imagem);
    });
    const totalOriginal = jogosDoCarrinho.reduce((soma, jogo) => soma + (Number(jogo.preco) || 0), 0);
    const totalFinal = jogosDoCarrinho.reduce((soma, jogo) => soma + calcularPrecoFinal(jogo), 0);
    const descontoTotal = Math.round((totalOriginal - totalFinal + Number.EPSILON) * 100) / 100;
    precoOriginal.textContent = formatarPreco(totalOriginal);
    precoFinal.textContent = formatarPreco(totalFinal);
    desconto.textContent = `-${formatarPreco(descontoTotal)}`;
    linhaDesconto.hidden = descontoTotal <= 0;
}

document.querySelectorAll('input[name="pagamento"]').forEach(opcao => opcao.addEventListener("change", ocultarErro));
document.querySelector("#botaoLogout").addEventListener("click", async () => {
    try {
        const resposta = await fetch("/logout", { method: "POST" });
        if (!resposta.ok) throw new Error("Não foi possível encerrar a sessão.");
        window.location.href = "../Login/Login.html";
    } catch (erro) {
        console.error(erro);
        mostrarErro("Não foi possível sair da conta. Tente novamente.");
    }
});

botaoComprar.addEventListener("click", async () => {
    ocultarErro();
    const nome = nomeComprador.value.trim();
    const selecionado = document.querySelector('input[name="pagamento"]:checked');
    const metodo = selecionado ? selecionado.value : "";
    if (!jogosDoCarrinho.length) return mostrarErro("Seu carrinho está vazio.");
    if (!nome) {
        mostrarErro("Digite seu nome para continuar.");
        nomeComprador.focus();
        return;
    }
    if (!metodo) return mostrarErro("Escolha uma forma de pagamento.");

    botaoComprar.disabled = true;
    botaoComprar.textContent = "Processando compra...";
    try {
        const resposta = await fetch("/comprar-todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, metodo })
        });
        const resultado = await resposta.json();
        
		if (!resposta.ok) {
			throw new Error(
				resultado.erro || "Não foi possível concluir a compra."
			);
		}

		areaCompra.style.display = "none";

		document.querySelector("#principal").style.minHeight = "80vh";

		textoSucesso.textContent =
			`${resultado.quantidade} ${
				resultado.quantidade === 1
					? "jogo foi adicionado"
					: "jogos foram adicionados"
			} à sua biblioteca.`;

		compraConcluida.style.display = "block";

		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});

    } catch (erro) {
        console.error(erro);
        mostrarErro(erro.message || "Ocorreu um erro ao processar a compra.");
        botaoComprar.disabled = false;
        botaoComprar.textContent = "Confirmar compra";
    }
});

carregarUsuario();
carregarCarrinho();