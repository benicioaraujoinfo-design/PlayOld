/* Cole esta rota no servidor ANTES de app.listen(PORT, ...).
   Ela é separada da rota individual POST /comprar. */
app.post("/comprar-todos", async (req, res) => {
    let conn;
    let transacaoIniciada = false;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({ erro: "Usuário não está logado." });
        }

        const IDusr = req.session.usuario.IDusr;
        const nome = String(req.body.nome || "").trim();
        const metodo = String(req.body.metodo || "").trim();

        if (!nome) return res.status(400).json({ erro: "Nome não informado." });
        const metodosPermitidos = ["Pix", "Cartão de crédito", "Carteira PlayOld"];
        if (!metodosPermitidos.includes(metodo)) {
            return res.status(400).json({ erro: "Forma de pagamento inválida." });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();
        transacaoIniciada = true;

        const itens = await conn.query(
            `SELECT j.IDgme, j.Game_Name, j.preco, COALESCE(j.desconto, 0) AS desconto
             FROM carrinho c
             INNER JOIN itens_carrinho ic ON ic.IDcarrinho = c.IDcarrinho
             INNER JOIN jogos j ON j.IDgme = ic.IDjogo
             WHERE c.IDusr = ?
             ORDER BY ic.IDitem DESC
             FOR UPDATE`,
            [IDusr]
        );

        if (itens.length === 0) {
            await conn.rollback();
            transacaoIniciada = false;
            return res.status(400).json({ erro: "Seu carrinho está vazio." });
        }

        const idsJogos = itens.map(jogo => Number(jogo.IDgme));
        const placeholders = idsJogos.map(() => "?").join(",");
        const jaPossui = await conn.query(
            `SELECT IDjgo FROM biblioteca
             WHERE IDusr = ? AND IDjgo IN (${placeholders})`,
            [IDusr, ...idsJogos]
        );

        if (jaPossui.length > 0) {
            await conn.rollback();
            transacaoIniciada = false;
            return res.status(409).json({
                erro: "Um ou mais jogos do carrinho já estão na sua biblioteca. Atualize o carrinho e tente novamente."
            });
        }

        for (const jogo of itens) {
            const preco = Number(jogo.preco) || 0;
            const descontoPercentual = Math.min(100, Math.max(0, Number(jogo.desconto) || 0));
            const precoFinal = Math.round((preco * (1 - descontoPercentual / 100) + Number.EPSILON) * 100) / 100;

            await conn.query(
                `INSERT INTO pagamento (IDjgo, IDcliente, preco, frm_pgmt, dta_pgmt)
                 VALUES (?, ?, ?, ?, NOW())`,
                [jogo.IDgme, IDusr, precoFinal, metodo]
            );

            /* Mantém a mesma estrutura da compra individual do projeto. */
            await conn.query(
                `INSERT INTO biblioteca (temp_jogo, IDusr, IDjgo)
                 VALUES (0, ?, ?)`,
                [IDusr, jogo.IDgme]
            );

            await conn.query(
                `DELETE FROM wishlist WHERE IDusr = ? AND IDjgo = ?`,
                [IDusr, jogo.IDgme]
            );

            await conn.query(
                `INSERT INTO atividades (IDusr, IDjgo, tipo)
                 VALUES (?, ?, ?)`,
                [IDusr, jogo.IDgme, "jogo_comprado"]
            );
        }

        await conn.query(
            `DELETE ic
             FROM itens_carrinho ic
             INNER JOIN carrinho c ON c.IDcarrinho = ic.IDcarrinho
             WHERE c.IDusr = ? AND ic.IDjogo IN (${placeholders})`,
            [IDusr, ...idsJogos]
        );

        await conn.commit();
        transacaoIniciada = false;
        return res.status(200).json({
            mensagem: "Todos os jogos foram comprados com sucesso.",
            quantidade: itens.length
        });
    } catch (erro) {
        if (conn && transacaoIniciada) {
            try { await conn.rollback(); }
            catch (erroRollback) { console.error("Erro ao desfazer compra coletiva:", erroRollback); }
        }
        console.error("Erro ao comprar todos os jogos:", erro);
        return res.status(500).json({ erro: "Não foi possível concluir a compra de todos os jogos." });
    } finally {
        if (conn) conn.release();
    }
});
