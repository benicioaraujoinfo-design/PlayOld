require("dotenv").config();

const express = require("express");
const mariadb = require("mariadb");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage()
});

console.log("Cloudinary configurado:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "OK" : "ERRO",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "ERRO"
});


app.use(express.json({ limit: "100mb" }));

app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const path = require("path");

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "Home", "Home.html"));
});

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "PlayOld",
    connectionLimit: 5
});


app.get("/teste-banco", async (req, res) => {

    let conn;

    try {

        conn = await pool.getConnection();

        const resultado = await conn.query(
            "SELECT 1 AS teste"
        );

        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Não foi possível conectar ao banco."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});


app.post("/cadastro", upload.single("foto"), async (req, res) => {

    let conn;

    try {

        const {
            UsrName,
            Email,
            DataNas,
            pais,
            senha
        } = req.body;


        if (!UsrName || !Email || !senha) {

            return res.status(400).json({
                erro: "Nome de usuário, e-mail e senha são obrigatórios."
            });

        }


        conn = await pool.getConnection();


        const usuarioExistente = await conn.query(
            "SELECT IDusr FROM Cliente WHERE Email = ?",
            [Email]
        );


        if (usuarioExistente.length > 0) {

            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });

        }

        const senhaHash = await bcrypt.hash(senha, 10);

let fotoPerfil = null;

if (req.file) {

    const resultado = await new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "PlayOld/perfis",
                resource_type: "image"
            },
            (erro, resultado) => {

                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }

            }
        );

        stream.end(req.file.buffer);

    });

    fotoPerfil = resultado.secure_url;
}

await conn.query(
    `INSERT INTO Cliente
    (UsrName, Email, DataNas, pais, senha, foto_perfil)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
        UsrName,
        Email,
        DataNas || null,
        pais || null,
        senhaHash,
        fotoPerfil
    ]
);

        res.status(201).json({
            mensagem: "Cadastro realizado com sucesso!"
        });


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno ao realizar o cadastro."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.post("/login", async (req, res) => {

    let conn;

    try {

        const { identificador, senha } = req.body;

        if (!identificador || !senha) {
            return res.status(400).json({
                erro: "Nome de usuário/e-mail e senha são obrigatórios."
            });
        }

        conn = await pool.getConnection();

        const usuarios = await conn.query(
            `SELECT IDusr, UsrName, Email, senha
             FROM Cliente
             WHERE UsrName = ? OR Email = ?`,
            [identificador, identificador]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                erro: "Usuário/e-mail ou senha incorretos."
            });
        }

        const usuario = usuarios[0];

		const senhaCorreta = await bcrypt.compare(
			senha,
			usuario.senha
		);

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "Usuário/e-mail ou senha incorretos."
            });
        }

        req.session.usuario = {
            IDusr: usuario.IDusr
        };

        res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            usuario: req.session.usuario
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno ao realizar o login."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/usuario", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                logado: false,
                mensagem: "Usuário não está logado."
            });

        }

        const IDusr = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        const resultado = await conn.query(
			`SELECT
				IDusr,
				UsrName,
				Email,
				foto_perfil,
				descricao,
				fundo_perfil
			 FROM Cliente
			 WHERE IDusr = ?`,
			[req.session.usuario.IDusr]
		);

        if (resultado.length === 0) {

			req.session.destroy(() => {});

			return res.status(404).json({
				logado: false,
				mensagem: "Usuário não encontrado."
			});

		}

		const usuario = resultado[0];

        res.status(200).json({
            logado: true,
            usuario: usuario
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar o perfil."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/usuarios/:id/perfil", async (req, res) => {
    let conn;

    try {
        const IDperfil = Number(req.params.id);

        if (!Number.isSafeInteger(IDperfil) || IDperfil <= 0) {
            return res.status(400).json({
                erro: "ID de usuário inválido."
            });
        }

        conn = await pool.getConnection();

        const usuarios = await conn.query(
            `SELECT
                IDusr,
                UsrName,
                foto_perfil,
                descricao,
                fundo_perfil
             FROM Cliente
             WHERE IDusr = ?
             LIMIT 1`,
            [IDperfil]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            usuario: usuarios[0]
        });

    } catch (erro) {
        console.error(
            "Erro ao carregar perfil de outro usuário:",
            erro
        );

        return res.status(500).json({
            erro: "Não foi possível carregar este perfil."
        });

    } finally {
        if (conn) {
            conn.release();
        }
    }
});

app.get("/usuarios/buscar", async (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            mensagem: "Faça login para buscar usuários."
        });
    }

    const termo = String(req.query.q || "").trim();

    if (termo.length < 2) {
        return res.json({ usuarios: [] });
    }

    try {
        const usuarios = await pool.query(
            `SELECT IDusr, UsrName, foto_perfil
             FROM Cliente
             WHERE IDusr <> ?
               AND UsrName LIKE ?
             ORDER BY UsrName ASC
             LIMIT 10`,
            [
                req.session.usuario.IDusr,
                `%${termo}%`
            ]
        );

        return res.json({ usuarios });

    } catch (erro) {
        console.error("Erro ao buscar usuários:", erro);

        return res.status(500).json({
            mensagem: "Erro ao buscar usuários."
        });
    }
});

app.get("/usuarios/:id/biblioteca", async (req, res) => {
    let conn;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDvisitante = Number(req.session.usuario.IDusr);
        const IDperfil = Number(req.params.id);

        if (!Number.isSafeInteger(IDperfil) || IDperfil <= 0) {
            return res.status(400).json({
                erro: "ID de usuário inválido."
            });
        }

        conn = await pool.getConnection();

        const usuarios = await conn.query(
            `SELECT IDusr
             FROM Cliente
             WHERE IDusr = ?
             LIMIT 1`,
            [IDperfil]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        if (IDvisitante !== IDperfil) {
            const IDusr1 = Math.min(IDvisitante, IDperfil);
            const IDusr2 = Math.max(IDvisitante, IDperfil);

            const amizades = await conn.query(
                `SELECT IDamizade
                 FROM amizades
                 WHERE IDusr1 = ? AND IDusr2 = ?
                 LIMIT 1`,
                [IDusr1, IDusr2]
            );

            if (amizades.length === 0) {
                return res.status(403).json({
                    erro: "Você só pode visualizar a biblioteca de seus amigos."
                });
            }
        }

        const jogos = await conn.query(
            `SELECT
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                biblioteca.temp_jogo,
                biblioteca.ultima_jogado,
                MAX(pagamento.dta_pgmt) AS data_compra
             FROM biblioteca
             INNER JOIN jogos
                ON jogos.IDgme = biblioteca.IDjgo
             LEFT JOIN pagamento
                ON pagamento.IDjgo = biblioteca.IDjgo
               AND pagamento.IDcliente = biblioteca.IDusr
             WHERE biblioteca.IDusr = ?
             GROUP BY
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                biblioteca.temp_jogo,
                biblioteca.ultima_jogado
             ORDER BY data_compra DESC`,
            [IDperfil]
        );

        return res.status(200).json({ jogos });

    } catch (erro) {
        console.error("Erro ao carregar biblioteca do perfil:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar os jogos deste usuário."
        });

    } finally {
        if (conn) conn.release();
    }
});

app.get("/usuarios/:id/amizades", async (req, res) => {
    let conn;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDvisitante = Number(req.session.usuario.IDusr);
        const IDperfil = Number(req.params.id);

        if (!Number.isSafeInteger(IDperfil) || IDperfil <= 0) {
            return res.status(400).json({
                erro: "ID de usuário inválido."
            });
        }

        conn = await pool.getConnection();

        const usuarios = await conn.query(
            `SELECT IDusr
             FROM Cliente
             WHERE IDusr = ?
             LIMIT 1`,
            [IDperfil]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        if (IDvisitante !== IDperfil) {
            const IDusr1 = Math.min(IDvisitante, IDperfil);
            const IDusr2 = Math.max(IDvisitante, IDperfil);

            const amizade = await conn.query(
                `SELECT IDamizade
                 FROM amizades
                 WHERE IDusr1 = ? AND IDusr2 = ?
                 LIMIT 1`,
                [IDusr1, IDusr2]
            );

            if (amizade.length === 0) {
                return res.status(403).json({
                    erro: "Você só pode visualizar a lista de amigos de seus amigos."
                });
            }
        }

        const amigos = await conn.query(
            `SELECT
                c.IDusr,
                c.UsrName,
                c.foto_perfil
             FROM amizades AS a
             INNER JOIN Cliente AS c
                ON c.IDusr = CASE
                    WHEN a.IDusr1 = ? THEN a.IDusr2
                    ELSE a.IDusr1
                END
             WHERE a.IDusr1 = ?
                OR a.IDusr2 = ?
             ORDER BY c.UsrName ASC`,
            [IDperfil, IDperfil, IDperfil]
        );

        return res.status(200).json({ amigos });

    } catch (erro) {
        console.error("Erro ao carregar amigos do perfil:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar os amigos deste usuário."
        });

    } finally {
        if (conn) conn.release();
    }
});

app.post("/logout", (req, res) => {

    req.session.destroy((erro) => {

        if (erro) {

            console.error(erro);

            return res.status(500).json({
                erro: "Não foi possível encerrar a sessão."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            mensagem: "Logout realizado com sucesso."
        });
    });
});


app.delete("/usuario", async (req, res) => {

    let conn;
    let transacaoIniciada = false;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const { senha } = req.body;

        if (!senha) {
            return res.status(400).json({
                erro: "Digite sua senha atual para confirmar."
            });
        }

        const IDusr = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        const usuarios = await conn.query(
            `SELECT senha
             FROM Cliente
             WHERE IDusr = ?`,
            [IDusr]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuarios[0].senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "Senha incorreta."
            });
        }

        await conn.beginTransaction();
        transacaoIniciada = true;

        await conn.query(
            `DELETE ic
             FROM itens_carrinho AS ic
             INNER JOIN carrinho AS c
                ON c.IDcarrinho = ic.IDcarrinho
             WHERE c.IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM carrinho
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM amizades
             WHERE IDusr1 = ? OR IDusr2 = ?`,
            [IDusr, IDusr]
        );

        await conn.query(
            `DELETE FROM pedidos_amizade
             WHERE IDremetente = ?
                OR IDdestinatario = ?`,
            [IDusr, IDusr]
        );

        await conn.query(
            `DELETE FROM comentarios
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM avaliacoes
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM biblioteca
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM saves
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM pagamento
             WHERE IDcliente = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM controles
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM atividades
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM wishlist
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.query(
            `DELETE FROM Cliente
             WHERE IDusr = ?`,
            [IDusr]
        );

        await conn.commit();
        transacaoIniciada = false;

        req.session.destroy((erro) => {

            if (erro) {
                console.error(
                    "Erro ao encerrar sessão após exclusão:",
                    erro
                );
            }

            res.clearCookie("connect.sid");

            return res.json({
                mensagem: "Conta excluída com sucesso."
            });

        });

    } catch (erro) {

        if (conn && transacaoIniciada) {
            await conn.rollback();
            transacaoIniciada = false;
        }

        console.error(
            "Erro ao excluir conta:",
            erro
        );

        return res.status(500).json({
            erro: "Não foi possível excluir a conta."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.post("/upload-foto", upload.single("foto"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                erro: "Nenhuma imagem foi enviada."
            });
        }

        const resultado = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "PlayOld/perfis",
                    resource_type: "image"
                },
                (erro, resultado) => {
                    if (erro) {
                        reject(erro);
                    } else {
                        resolve(resultado);
                    }
                }
            );

            stream.end(req.file.buffer);
        });

        console.log("Imagem enviada:", resultado.secure_url);

        res.json({
            mensagem: "Imagem enviada com sucesso!",
            url: resultado.secure_url
        });

    } catch (erro) {
        console.error("Erro ao enviar imagem:", erro);

        res.status(500).json({
            erro: "Não foi possível enviar a imagem."
        });
    }
});


app.post(
    "/upload-fundo-perfil",
    upload.single("fundo"),
    async (req, res) => {

        try {
            if (!req.session.usuario) {
                return res.status(401).json({
                    erro: "Você precisa estar logado."
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    erro: "Nenhuma imagem foi enviada."
                });
            }

            if (!req.file.mimetype.startsWith("image/")) {
                return res.status(400).json({
                    erro: "O arquivo precisa ser uma imagem."
                });
            }

            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(413).json({
                    erro: "A imagem deve ter no máximo 5 MB."
                });
            }

            const resultado = await new Promise(
                (resolve, reject) => {

                    const stream =
                        cloudinary.uploader.upload_stream(
                            {
                                folder: "PlayOld/fundos-perfil",
                                resource_type: "image"
                            },
                            (erro, resultado) => {
                                if (erro) {
                                    reject(erro);
                                } else {
                                    resolve(resultado);
                                }
                            }
                        );

                    stream.end(req.file.buffer);
                }
            );

            return res.status(200).json({
                mensagem: "Imagem de fundo enviada!",
                url: resultado.secure_url
            });

        } catch (erro) {
            console.error(
                "Erro ao enviar fundo do perfil:",
                erro
            );

            return res.status(500).json({
                erro: "Não foi possível enviar a imagem."
            });
        }
    }
);


app.put("/usuario/editar", async (req, res) => {

    let conn;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const {
			UsrName,
			Email,
			descricao,
			senha,
			confirmarSenha,
			fundo_perfil
		} = req.body;

        const nome = typeof UsrName === "string"
            ? UsrName.trim()
            : "";

        const email = typeof Email === "string"
            ? Email.trim()
            : "";
            
        const novaDescricao = typeof descricao === "string"
			? descricao.trim()
			: "";

		if (novaDescricao.length > 500) {
			return res.status(400).json({
				erro: "A descrição deve ter até 500 caracteres."
			});
		}

        const novaSenha = typeof senha === "string"
            ? senha
            : "";

        const confirmacao = typeof confirmarSenha === "string"
            ? confirmarSenha
            : "";

        if (!nome || !email) {
            return res.status(400).json({
                erro: "Nome e e-mail são obrigatórios."
            });
        }

        if (nome.length > 50) {
            return res.status(400).json({
                erro: "O nome deve ter até 50 caracteres."
            });
        }

        if (email.length > 100 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            return res.status(400).json({
                erro: "Informe um e-mail válido."
            });
        }

        if (novaSenha || confirmacao) {

            if (!novaSenha || !confirmacao) {
                return res.status(400).json({
                    erro: "Preencha os dois campos de senha."
                });
            }

            if (novaSenha !== confirmacao) {
                return res.status(400).json({
                    erro: "As senhas não coincidem."
                });
            }

            if (novaSenha.length < 6) {
                return res.status(400).json({
                    erro: "A nova senha deve ter pelo menos 6 caracteres."
                });
            }
        }

        const campos = [
			"UsrName = ?",
			"Email = ?",
			"descricao = ?"
		];

		const valores = [
			nome,
			email,
			novaDescricao
		];

        if (novaSenha && confirmacao) {
            const senhaHash = await bcrypt.hash(
                novaSenha,
                10
            );

            campos.push("senha = ?");
            valores.push(senhaHash);
        }

        if (fundo_perfil !== undefined) {

            if (
                typeof fundo_perfil !== "string" ||
                fundo_perfil.length > 255 ||
                (
                    fundo_perfil !== "" &&
                    !fundo_perfil.startsWith("https://")
                )
            ) {
                return res.status(400).json({
                    erro: "URL da imagem de fundo inválida."
                });
            }

            campos.push("fundo_perfil = ?");
            valores.push(fundo_perfil || null);
        }

        valores.push(req.session.usuario.IDusr);

        conn = await pool.getConnection();

        await conn.query(
            `UPDATE Cliente
             SET ${campos.join(", ")}
             WHERE IDusr = ?`,
            valores
        );

        return res.status(200).json({
            mensagem: "Perfil atualizado com sucesso!"
        });

    } catch (erro) {
        console.error(
            "Erro ao editar perfil:",
            erro
        );

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Este nome de usuário ou e-mail já está em uso."
            });
        }

        return res.status(500).json({
            erro: "Não foi possível atualizar o perfil."
        });

    } finally {
        if (conn) {
            conn.release();
        }
    }
});

const consolesPermitidos = [
    "NES",
    "SNES",
    "MEGA_DRIVE",
    "GAME_BOY_COLOR",
    "GAME_BOY_ADVANCE",
    "N64"
];

app.get("/controles", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idUsuario = req.session.usuario.IDusr;
        const consoleNome = req.query.console || "NES";

        if (!consolesPermitidos.includes(consoleNome)) {
            return res.status(400).json({
                erro: "Console inválido."
            });
        }

        conn = await pool.getConnection();

        await conn.query(
            `INSERT INTO controles (IDusr, console_nome)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
                 IDcontrole = IDcontrole`,
            [idUsuario, consoleNome]
        );

        const resultado = await conn.query(
            `SELECT
                cima,
                baixo,
                esquerda,
                direita,
                botao_a,
                botao_b,
                botao_x,
                botao_y,
                botao_l,
                botao_r,
                start,
                select_btn
             FROM controles
             WHERE IDusr = ?
               AND console_nome = ?
             LIMIT 1`,
            [idUsuario, consoleNome]
        );

        res.status(200).json({
            console: consoleNome,
            controles: resultado[0]
        });

    } catch (erro) {

        console.error("Erro ao carregar controles:", erro);

        res.status(500).json({
            erro: "Erro ao carregar os controles."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.put("/controles", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idUsuario = req.session.usuario.IDusr;
        const consoleNome = req.body.console || "NES";

        const dados = req.body.controles || req.body;
        
        if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
			return res.status(400).json({
				erro: "Formato dos controles inválido."
			});
		}

        if (!consolesPermitidos.includes(consoleNome)) {
            return res.status(400).json({
                erro: "Console inválido."
            });
        }

        const camposPermitidos = [
            "cima",
            "baixo",
            "esquerda",
            "direita",
            "botao_a",
            "botao_b",
            "botao_x",
            "botao_y",
            "botao_l",
            "botao_r",
            "start",
            "select_btn"
        ];

        const campos = camposPermitidos.filter(campo =>
            Object.prototype.hasOwnProperty.call(dados, campo) &&
            typeof dados[campo] === "string" &&
            dados[campo].length > 0 &&
            dados[campo].length <= 20
        );

        if (campos.length === 0) {
            return res.status(400).json({
                erro: "Nenhuma tecla válida foi enviada."
            });
        }

        conn = await pool.getConnection();

        await conn.query(
            `INSERT INTO controles (IDusr, console_nome)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
                 IDcontrole = IDcontrole`,
            [idUsuario, consoleNome]
        );

        const atualizacoes = campos
            .map(campo => `\`${campo}\` = ?`)
            .join(", ");

        const valores = campos.map(campo => dados[campo]);

        await conn.query(
            `UPDATE controles
             SET ${atualizacoes}
             WHERE IDusr = ?
               AND console_nome = ?`,
            [...valores, idUsuario, consoleNome]
        );

        res.status(200).json({
            mensagem: "Controles salvos com sucesso.",
            console: consoleNome
        });

    } catch (erro) {

        console.error("Erro ao salvar controles:", erro);

        res.status(500).json({
            erro: "Erro ao salvar os controles."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.post("/upload-capa", upload.single("capa"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                erro: "Nenhuma capa foi enviada."
            });
        }

        const resultado = await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "PlayOld/capas",
                    resource_type: "image"
                },
                (erro, resultado) => {

                    if (erro) {
                        reject(erro);
                    } else {
                        resolve(resultado);
                    }

                }
            );

            stream.end(req.file.buffer);

        });

        console.log("Capa enviada:", resultado.secure_url);

        res.json({
            mensagem: "Capa enviada com sucesso!",
            url: resultado.secure_url
        });

    } catch (erro) {

        console.error("Erro ao enviar capa:", erro);

        res.status(500).json({
            erro: "Não foi possível enviar a capa."
        });

    }

});

app.put("/jogo/capa", async (req, res) => {

    let conn;

    try {

        const { IDgme, url } = req.body;

        if (!IDgme || !url) {
            return res.status(400).json({
                erro: "ID do jogo e URL da capa são obrigatórios."
            });
        }

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `UPDATE jogos
             SET img1 = ?
             WHERE IDgme = ?`,
            [url, IDgme]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Jogo não encontrado."
            });
        }

        res.status(200).json({
            mensagem: "Capa do jogo atualizada com sucesso!"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao atualizar a capa do jogo."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/buscar-jogos", async (req, res) => {

    let conn;

    try {

        const nome = req.query.nome;

        if (!nome) {

            return res.status(200).json({
                jogos: []
            });

        }

        conn = await pool.getConnection();

        const jogos = await conn.query(
            `SELECT
                IDgme,
                Game_Name,
                img1
             FROM jogos
             WHERE Game_Name LIKE ?
             ORDER BY Game_Name ASC
             LIMIT 5`,
            [`%${nome}%`]
        );

        res.status(200).json({
            jogos: jogos
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao pesquisar jogos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/wishlist/verificar/:id", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const IDjgo = Number(req.params.id);

        if (!Number.isInteger(IDjgo)) {
            return res.status(400).json({
                erro: "ID do jogo inválido."
            });
        }

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `SELECT IDwishlist
             FROM wishlist
             WHERE IDusr = ?
             AND IDjgo = ?`,
            [
                req.session.usuario.IDusr,
                IDjgo
            ]
        );

        res.status(200).json({
            naWishlist: resultado.length > 0
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao verificar lista de desejos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});


app.post("/wishlist", async (req, res) => {

    let conn;
    let transacaoIniciada = false;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const IDjgo = Number(req.body.IDjgo);

        if (!Number.isInteger(IDjgo)) {
            return res.status(400).json({
                erro: "ID do jogo inválido."
            });
        }

        conn = await pool.getConnection();

        await conn.beginTransaction();
        transacaoIniciada = true;

        await conn.query(
            `INSERT INTO wishlist (
                IDusr,
                IDjgo
            )
            VALUES (?, ?)`,
            [
                req.session.usuario.IDusr,
                IDjgo
            ]
        );

        await conn.query(
            `INSERT INTO atividades (
                IDusr,
                IDjgo,
                tipo
            )
            VALUES (?, ?, ?)`,
            [
                req.session.usuario.IDusr,
                IDjgo,
                "wishlist_adicionado"
            ]
        );

        await conn.commit();
        transacaoIniciada = false;

        return res.status(201).json({
            mensagem: "Jogo adicionado à lista de desejos."
        });

    } catch (erro) {

        if (conn && transacaoIniciada) {
            try {
                await conn.rollback();
                transacaoIniciada = false;
            } catch (erroRollback) {
                console.error(
                    "Erro ao desfazer a transação da wishlist:",
                    erroRollback
                );
            }
        }
        
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(200).json({
                mensagem: "Jogo já está na lista de desejos."
            });
        }

        console.error(
            "Erro ao adicionar jogo à lista de desejos:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao adicionar jogo à lista de desejos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.delete("/wishlist/jogo/:id", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const IDjgo = Number(req.params.id);

        if (!Number.isInteger(IDjgo)) {
            return res.status(400).json({
                erro: "ID do jogo inválido."
            });
        }

        conn = await pool.getConnection();

        await conn.query(
            `DELETE FROM wishlist
             WHERE IDusr = ?
             AND IDjgo = ?`,
            [
                req.session.usuario.IDusr,
                IDjgo
            ]
        );

        res.status(200).json({
            mensagem: "Jogo removido da lista de desejos."
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao remover jogo da lista de desejos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/wishlist", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                erro: "Usuário não está logado."
            });

        }

        conn = await pool.getConnection();

        const jogos = await conn.query(
            `SELECT
                wishlist.IDwishlist,
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                jogos.preco,
                jogos.desconto,
                wishlist.data_adicao

             FROM wishlist

             INNER JOIN jogos
                ON jogos.IDgme = wishlist.IDjgo

             WHERE wishlist.IDusr = ?

             ORDER BY wishlist.data_adicao DESC`,

            [req.session.usuario.IDusr]
        );

        res.status(200).json({
            jogos: jogos
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar lista de desejos:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar lista de desejos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.post("/comprar", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                erro: "Usuário não está logado."
            });

        }

        const IDusr =
            req.session.usuario.IDusr;

        const IDjgo =
            Number(req.body.IDjgo);

        const nome =
            String(req.body.nome || "").trim();

        const metodo =
            String(req.body.metodo || "").trim();

        if (!Number.isInteger(IDjgo)) {

            return res.status(400).json({
                erro: "ID do jogo inválido."
            });

        }


        if (nome === "") {

            return res.status(400).json({
                erro: "Nome não informado."
            });

        }


        const metodosPermitidos = [
            "Pix",
            "Cartão de crédito",
            "Carteira PlayOld"
        ];


        if (!metodosPermitidos.includes(metodo)) {

            return res.status(400).json({
                erro: "Forma de pagamento inválida."
            });

        }

        conn =
            await pool.getConnection();

        await conn.beginTransaction();

        const jogos =
            await conn.query(
                `SELECT
                    IDgme,
                    Game_Name,
                    preco,
                    desconto
                 FROM jogos
                 WHERE IDgme = ?`,
                [IDjgo]
            );


        if (jogos.length === 0) {

            await conn.rollback();

            return res.status(404).json({
                erro: "Jogo não encontrado."
            });

        }


        const jogo =
            jogos[0];

        const possui =
            await conn.query(
                `SELECT IDbbtc
                 FROM biblioteca
                 WHERE IDusr = ?
                 AND IDjgo = ?`,
                [
                    IDusr,
                    IDjgo
                ]
            );


        if (possui.length > 0) {

            await conn.rollback();

            return res.status(409).json({
                erro: "Você já possui este jogo."
            });

        }

        const preco =
            Number(jogo.preco) || 0;

        const desconto =
            Number(jogo.desconto) || 0;

        const precoFinal =
            Number(
                (
                    preco *
                    (1 - desconto / 100)
                ).toFixed(2)
            );

        await conn.query(
            `INSERT INTO pagamento (
                IDjgo,
                IDcliente,
                preco,
                frm_pgmt,
                dta_pgmt
             )
             VALUES (?, ?, ?, ?, CURDATE())`,
            [
                IDjgo,
                IDusr,
                precoFinal,
                metodo
            ]
        );

        await conn.query(
            `INSERT INTO biblioteca (
                temp_jogo,
                IDusr,
                IDjgo
             )
             VALUES (?, ?, ?)`,
            [
                0,
                IDusr,
                IDjgo
            ]
        );

        await conn.query(
            `DELETE FROM wishlist
             WHERE IDusr = ?
             AND IDjgo = ?`,
            [
                IDusr,
                IDjgo
            ]
        );

		
		await conn.query(
			`INSERT INTO atividades (
				IDusr,
				IDjgo,
				tipo
			)
			VALUES (?, ?, ?)`,
			[
				IDusr,
				IDjgo,
				"jogo_comprado"
			]
		);
				
        await conn.query(
            `DELETE ic
             FROM itens_carrinho AS ic
             INNER JOIN carrinho AS c
                ON c.IDcarrinho = ic.IDcarrinho
             WHERE c.IDusr = ?
               AND ic.IDjogo = ?`,
            [IDusr, IDjgo]
        );



        await conn.commit();


        res.status(201).json({

            mensagem:
                "Compra concluída com sucesso.",

            jogo: {
                IDgme:
                    jogo.IDgme,

                Game_Name:
                    jogo.Game_Name
            },

            preco:
                precoFinal,

            metodo:
                metodo

        });


    } catch (erro) {

        console.error(
            "Erro ao realizar compra:",
            erro
        );


        if (conn) {

            try {

                await conn.rollback();

            } catch (erroRollback) {

                console.error(
                    "Erro ao desfazer transação:",
                    erroRollback
                );

            }

        }


        res.status(500).json({
            erro: "Erro ao realizar a compra."
        });


    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.put("/usuario/foto", async (req, res) => {
	
    let conn;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                erro: "URL da foto não foi enviada."
            });
        }

        const IDusr = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        await conn.query(
            `UPDATE Cliente
             SET foto_perfil = ?
             WHERE IDusr = ?`,
            [url, IDusr]
        );

        res.status(200).json({
            mensagem: "Foto de perfil atualizada com sucesso!"
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao atualizar a foto de perfil."
        });

    } finally {
        if (conn) conn.release();
    }
});

app.get("/jogo/:id", async (req, res) => {

    let conn;

    try {

        const idJogo = req.params.id;

        conn = await pool.getConnection();


        const jogos = await conn.query(
            `SELECT
				IDgme,
				Game_Name,
				img1,
				img2,
				img3,
				img4,
				img5,
				img6,
				img7,
				img8,
				img9,
				img10,
				img11,
				img12,
				Descricao,
				desconto,
				produtora,
				publicadora,
				preco,
				class_idade,
				genero,
				data_lancamento
			FROM jogos
             WHERE IDgme = ?`,
            [idJogo]
        );


        if (jogos.length === 0) {

            return res.status(404).json({
                erro: "Jogo não encontrado."
            });

        }


        const consoles = await conn.query(
            `SELECT
                console.Console_Nome
             FROM jogos_consoles
             INNER JOIN console
                ON console.IDcsl = jogos_consoles.IDcsl
             WHERE jogos_consoles.IDjgo = ?`,
            [idJogo]
        );


        res.status(200).json({

            jogo: jogos[0],

            consoles: consoles

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar jogo:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar o jogo."
        });


    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/jogo/:id/comprado", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                comprado: false
            });
        }

        const idJogo = req.params.id;
        const idUsuario = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `SELECT IDpgmt
             FROM pagamento
             WHERE IDjgo = ?
             AND IDcliente = ?
             LIMIT 1`,
            [idJogo, idUsuario]
        );

        if (resultado.length > 0) {

            return res.status(200).json({
                comprado: true
            });

        }

        res.status(200).json({
            comprado: false
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao verificar compra."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/jogo/:id/rom", async (req, res) => {
    let conn;

    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idJogo = req.params.id;
        const idUsuario = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `SELECT
                jogos.Game_Name,
                jogos.rom,
                jogos.console
             FROM jogos
             INNER JOIN biblioteca
                ON biblioteca.IDjgo = jogos.IDgme
             WHERE jogos.IDgme = ?
             AND biblioteca.IDusr = ?
             LIMIT 1`,
            [idJogo, idUsuario]
        );

        if (resultado.length === 0) {
            return res.status(403).json({
                erro: "Você não possui este jogo."
            });
        }

        if (!resultado[0].rom) {
            return res.status(404).json({
                erro: "Este jogo não possui uma ROM cadastrada."
            });
        }

        res.status(200).json({
			Game_Name: resultado[0].Game_Name,
			rom: resultado[0].rom,
			console: resultado[0].console
		});

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao verificar acesso ao jogo."
        });

    } finally {
        if (conn) {
            conn.release();
        }
    }
});

app.get("/produtoras", async (req, res) => {

    let conn;

    try {

        conn = await pool.getConnection();

        const produtoras = await conn.query(
            `SELECT
                IDpro,
                Produtora_Nome,
                logo
             FROM produtoras
             ORDER BY Produtora_Nome ASC`
        );

        res.status(200).json({
            produtoras: produtoras
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar produtoras:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar as produtoras."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});


app.get("/publicadoras", async (req, res) => {

    let conn;

    try {

        conn = await pool.getConnection();

        const publicadoras = await conn.query(
            `SELECT
                IDpub,
                Publicadora_Nome,
                logo
             FROM publicadoras
             ORDER BY Publicadora_Nome ASC`
        );

        res.status(200).json({
            publicadoras: publicadoras
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar publicadoras:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar as publicadoras."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/publicadora/:id", async (req, res) => {

    let conn;

    try {

        const idPublicadora = req.params.id;

        conn = await pool.getConnection();


        const publicadoraResultado = await conn.query(
            `SELECT
                IDpub,
                Publicadora_Nome,
                logo,
                ano_criacao
             FROM publicadoras
             WHERE IDpub = ?`,
            [idPublicadora]
        );


        if (publicadoraResultado.length === 0) {

            return res.status(404).json({
                erro: "Publicadora não encontrada."
            });

        }


        const jogos = await conn.query(
            `SELECT
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                jogos.desconto,
                jogos.preco
             FROM jogos
             WHERE jogos.IDpub = ?
             ORDER BY jogos.Game_Name ASC`,
            [idPublicadora]
        );


        res.status(200).json({

            publicadora: publicadoraResultado[0],

            jogos: jogos

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar publicadora:",
            erro
        );


        res.status(500).json({
            erro: "Erro ao carregar a publicadora."
        });


    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/produtora/:id", async (req, res) => {

    let conn;

    try {

        const idProdutora = req.params.id;

        conn = await pool.getConnection();


        const produtoraResultado = await conn.query(
            `SELECT
                IDpro,
                Produtora_Nome,
                logo,
                ano_criacao
             FROM produtoras
             WHERE IDpro = ?`,
            [idProdutora]
        );


        if (produtoraResultado.length === 0) {

            return res.status(404).json({
                erro: "Produtora não encontrada."
            });

        }


        const jogos = await conn.query(
            `SELECT
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                jogos.desconto,
                jogos.preco
             FROM jogos
             WHERE jogos.IDpro = ?
             ORDER BY jogos.Game_Name ASC`,
            [idProdutora]
        );


        res.status(200).json({

            produtora: produtoraResultado[0],

            jogos: jogos

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar produtora:",
            erro
        );


        res.status(500).json({
            erro: "Erro ao carregar a produtora."
        });


    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/jogos", async (req, res) => {
    let conn;

    try {
        conn = await pool.getConnection();

        const genero = req.query.genero;

        let jogos;

        if (genero) {

            jogos = await conn.query(
                `SELECT
                    IDgme,
                    Game_Name,
                    img1,
                    desconto,
                    preco,
                    genero
                 FROM jogos
                 WHERE genero = ?
                 ORDER BY Game_Name`,
                [genero]
            );

        } else {

            jogos = await conn.query(
                `SELECT
                    IDgme,
                    Game_Name,
                    img1,
                    desconto,
                    preco
                 FROM jogos
                 WHERE desconto > 0
                 ORDER BY RAND()
                 LIMIT 6`
            );

        }

        res.status(200).json({ jogos });

    } catch (erro) {

        console.error(
            "Erro ao carregar jogos:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar os jogos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }
});

app.get("/jogos/carrossel", async (req, res) => {
    let conn;

    try {

        conn = await pool.getConnection();

        const jogos = await conn.query(
            `SELECT
                IDgme,
                Game_Name,
                img1
             FROM jogos
             ORDER BY RAND()`
        );

        res.status(200).json({ jogos });

    } catch (erro) {

        console.error(
            "Erro ao carregar jogos do carrossel:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar os jogos do carrossel."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }
});

app.get("/biblioteca", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                erro: "Usuário não está logado."
            });

        }

        const idUsuario = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        const jogos = await conn.query(
            `SELECT
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                biblioteca.temp_jogo,
                biblioteca.ultima_jogado,
                MAX(pagamento.dta_pgmt) AS data_compra
             FROM biblioteca
             INNER JOIN jogos
                ON jogos.IDgme = biblioteca.IDjgo
             LEFT JOIN pagamento
                ON pagamento.IDjgo = biblioteca.IDjgo
               AND pagamento.IDcliente = biblioteca.IDusr
             WHERE biblioteca.IDusr = ?
             GROUP BY
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                biblioteca.temp_jogo,
                biblioteca.ultima_jogado
             ORDER BY data_compra DESC`,
            [idUsuario]
        );

        res.status(200).json({
            jogos: jogos
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar biblioteca:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar biblioteca."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/atividades/minhas", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDusr = req.session.usuario.IDusr;

        const pagina = Number(req.query.pagina || 1);

        if (
            !Number.isSafeInteger(pagina) ||
            pagina < 1
        ) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const limite = 20;
        const deslocamento = (pagina - 1) * limite;

        if (!Number.isSafeInteger(deslocamento)) {
            return res.status(400).json({
                erro: "Número de página muito alto."
            });
        }

        conn = await pool.getConnection();

        const atividades = await conn.query(
            `SELECT
                a.IDatividade,
                a.tipo,
                a.data_atividade,
                j.IDgme,
                j.Game_Name,
                j.img1
             FROM atividades AS a
             INNER JOIN jogos AS j
                ON j.IDgme = a.IDjgo
             WHERE a.IDusr = ?
             ORDER BY
                a.data_atividade DESC,
                a.IDatividade DESC
             LIMIT ? OFFSET ?`,
            [
                IDusr,
                limite,
                deslocamento
            ]
        );

        const resultadoTotal = await conn.query(
            `SELECT COUNT(*) AS total
             FROM atividades
             WHERE IDusr = ?`,
            [IDusr]
        );

        const total = Number(resultadoTotal[0].total);

        return res.status(200).json({
            atividades,
            paginacao: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite)
            }
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar histórico de atividades:",
            erro
        );

        return res.status(500).json({
            erro: "Não foi possível carregar seu histórico."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/atividades/amigos", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDusr = req.session.usuario.IDusr;

        const pagina = Number(req.query.pagina || 1);

        if (
            !Number.isSafeInteger(pagina) ||
            pagina < 1
        ) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const limite = 20;
        const deslocamento = (pagina - 1) * limite;

        if (!Number.isSafeInteger(deslocamento)) {
            return res.status(400).json({
                erro: "Número de página muito alto."
            });
        }

        conn = await pool.getConnection();

        const atividades = await conn.query(
            `SELECT
                a.IDatividade,
                a.IDusr,
                c.UsrName,
                c.foto_perfil,
                a.tipo,
                a.data_atividade,
                j.IDgme,
                j.Game_Name,
                j.img1
             FROM atividades AS a

             INNER JOIN amizades AS am
                ON (
                    am.IDusr1 = ?
                    AND am.IDusr2 = a.IDusr
                )
                OR (
                    am.IDusr2 = ?
                    AND am.IDusr1 = a.IDusr
                )

             INNER JOIN Cliente AS c
                ON c.IDusr = a.IDusr

             INNER JOIN jogos AS j
                ON j.IDgme = a.IDjgo

             ORDER BY
                a.data_atividade DESC,
                a.IDatividade DESC

             LIMIT ? OFFSET ?`,
            [
                IDusr,
                IDusr,
                limite,
                deslocamento
            ]
        );

        const resultadoTotal = await conn.query(
            `SELECT COUNT(*) AS total
             FROM atividades AS a

             WHERE EXISTS (
                 SELECT 1
                 FROM amizades AS am

                 WHERE (
                     am.IDusr1 = ?
                     AND am.IDusr2 = a.IDusr
                 )
                 OR (
                     am.IDusr2 = ?
                     AND am.IDusr1 = a.IDusr
                 )
             )`,
            [
                IDusr,
                IDusr
            ]
        );

        const total = Number(resultadoTotal[0].total);

        return res.status(200).json({
            atividades,
            paginacao: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite)
            }
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar atividades dos amigos:",
            erro
        );

        return res.status(500).json({
            erro: "Não foi possível carregar as atividades dos amigos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});


app.post("/jogo/:id/jogado", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                erro: "Usuário não está logado."
            });

        }

        const idJogo = req.params.id;

        const idUsuario = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `UPDATE biblioteca
             SET ultima_jogado = NOW()
             WHERE IDjgo = ?
             AND IDusr = ?`,
            [idJogo, idUsuario]
        );

        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                erro: "Jogo não encontrado na biblioteca."
            });

        }

        res.status(200).json({
            mensagem: "Última vez jogado atualizada."
        });

    } catch (erro) {

        console.error(
            "Erro ao atualizar última vez jogado:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao atualizar última vez jogado."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.post("/jogo/:id/tempo", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                erro: "Usuário não está logado."
            });

        }

        const idJogo = req.params.id;

        const idUsuario = req.session.usuario.IDusr;

        const tempo = Number(req.body.tempo);

        if (!Number.isFinite(tempo) || tempo < 0) {

            return res.status(400).json({
                erro: "Tempo de jogo inválido."
            });

        }

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `UPDATE biblioteca
             SET temp_jogo = temp_jogo + ?
             WHERE IDjgo = ?
             AND IDusr = ?`,
            [tempo, idJogo, idUsuario]
        );

        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                erro: "Jogo não encontrado na biblioteca."
            });

        }

        res.status(200).json({
            mensagem: "Tempo de jogo atualizado."
        });

    } catch (erro) {

        console.error(
            "Erro ao atualizar tempo de jogo:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao atualizar tempo de jogo."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/jogos/mais-jogados", async (req, res) => {

    let conn;

    try {

        conn = await pool.getConnection();

        const jogos = await conn.query(
            `SELECT
                IDgme,
                Game_Name,
                img1,
                desconto,
                preco
             FROM jogos
             ORDER BY RAND()
             LIMIT 6`
        );

        res.status(200).json({
            jogos: jogos
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar mais jogados:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar os jogos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/jogo/:id/mesma-produtora", async (req, res) => {
    let conn;

    try {
        const idJogo = req.params.id;

        conn = await pool.getConnection();

        const jogos = await conn.query(
            `SELECT
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                jogos.desconto,
                jogos.preco
             FROM jogos
             INNER JOIN (
                 SELECT produtora
                 FROM jogos
                 WHERE IDgme = ?
             ) AS jogoAtual
             ON jogos.produtora = jogoAtual.produtora
             WHERE jogos.IDgme != ?
             ORDER BY RAND()
             LIMIT 3`,
            [idJogo, idJogo]
        );

        res.status(200).json({ jogos });

    } catch (erro) {
        console.error(
            "Erro ao carregar jogos da mesma produtora:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar jogos da mesma produtora."
        });

    } finally {
        if (conn) {
            conn.release();
        }
    }
});

app.get("/jogo/:id/mesmo-genero", async (req, res) => {
    let conn;

    try {
        const idJogo = req.params.id;

        conn = await pool.getConnection();

        const jogos = await conn.query(
            `SELECT
                jogos.IDgme,
                jogos.Game_Name,
                jogos.img1,
                jogos.desconto,
                jogos.preco
             FROM jogos
             INNER JOIN (
                 SELECT genero
                 FROM jogos
                 WHERE IDgme = ?
             ) AS jogoAtual
             ON jogos.genero = jogoAtual.genero
             WHERE jogos.IDgme != ?
             ORDER BY RAND()
             LIMIT 3`,
            [idJogo, idJogo]
        );

        res.status(200).json({ jogos });

    } catch (erro) {
        console.error(
            "Erro ao carregar jogos do mesmo gênero:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar jogos do mesmo gênero."
        });

    } finally {
        if (conn) {
            conn.release();
        }
    }
});

app.put("/jogo/:id/save", async (req, res) => {
    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idUsuario = req.session.usuario.IDusr;
        const idJogo = req.params.id;
        const saveData = req.body.save_data;

        if (!saveData || typeof saveData !== "string") {
            return res.status(400).json({
                erro: "Dados do save inválidos."
            });
        }

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `INSERT INTO saves
            (IDusr, IDjgo, save_data)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                save_data = VALUES(save_data),
                data_save = CURRENT_TIMESTAMP`,
            [
                idUsuario,
                idJogo,
                saveData
            ]
        );

        res.status(200).json({
            mensagem: "Save salvo com sucesso."
        });

    } catch (erro) {

        console.error("Erro ao salvar estado:", erro);

        res.status(500).json({
            erro: "Erro ao salvar o estado do jogo."
        });

    } finally {

        if (conn) conn.release();

    }
});

app.get("/jogo/:id/save", async (req, res) => {
    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Usuário não está logado."
            });
        }

        const idUsuario = req.session.usuario.IDusr;
        const idJogo = req.params.id;

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `SELECT
                save_data,
                data_save
             FROM saves
             WHERE IDusr = ?
             AND IDjgo = ?
             LIMIT 1`,
            [
                idUsuario,
                idJogo
            ]
        );

        if (resultado.length === 0) {

            return res.status(404).json({
                erro: "Nenhum save encontrado."
            });

        }

        res.status(200).json({
            save_data: resultado[0].save_data,
            data_save: resultado[0].data_save
        });

    } catch (erro) {

        console.error("Erro ao carregar estado:", erro);

        res.status(500).json({
            erro: "Erro ao carregar o estado do jogo."
        });

    } finally {

        if (conn) conn.release();

    }
});

app.get("/jogo/:id/save-state", async (req, res) => {
    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).send(
                "Usuário não está logado."
            );
        }

        const idUsuario =
            req.session.usuario.IDusr;

        const idJogo = req.params.id;

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `SELECT save_data
             FROM saves
             WHERE IDusr = ?
             AND IDjgo = ?
             LIMIT 1`,
            [
                idUsuario,
                idJogo
            ]
        );

        if (resultado.length === 0) {
            return res.status(404).send(
                "Nenhum save encontrado."
            );
        }

        const saveData =
            resultado[0].save_data;

        const estado = Buffer.from(
            saveData,
            "base64"
        );

        res.setHeader(
            "Content-Type",
            "application/octet-stream"
        );

        res.setHeader(
            "Content-Length",
            estado.length
        );

        res.send(estado);

    } catch (erro) {

        console.error(
            "Erro ao fornecer save state:",
            erro
        );

        res.status(500).send(
            "Erro ao carregar o save state."
        );

    } finally {

        if (conn) {
            conn.release();
        }

    }
});

app.get("/console/:id", async (req, res) => {
    let conn;

    try {

        const idConsole =
            req.params.id;

        conn =
            await pool.getConnection();


        const consoleResultado =
            await conn.query(
                `SELECT
                    IDcsl,
                    Console_Nome,
                    Console_Data,
                    geracao,
                    QNTjogos,
                    imagem,
                    video
                 FROM console
                 WHERE IDcsl = ?`,
                [idConsole]
            );


        if (consoleResultado.length === 0) {

            return res.status(404).json({
                erro: "Console não encontrado."
            });

        }


        const jogos =
            await conn.query(
                `SELECT
                    jogos.IDgme,
                    jogos.Game_Name,
                    jogos.img1,
                    jogos.desconto,
                    jogos.preco
                 FROM jogos_consoles
                 INNER JOIN jogos
                    ON jogos.IDgme = jogos_consoles.IDjgo
                 WHERE jogos_consoles.IDcsl = ?
                 ORDER BY jogos.Game_Name ASC`,
                [idConsole]
            );


        res.status(200).json({

            console: consoleResultado[0],

            jogos: jogos

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar console:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar o console."
        });


    } finally {

        if (conn) {
            conn.release();
        }

    }
});

app.post("/comentarios", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                erro: "Usuário não está logado."
            });

        }


        const IDusr =
            req.session.usuario.IDusr;

        const IDjgo =
            req.body.IDjgo;

        const comentario =
            req.body.comentario;

        const tipo =
            req.body.tipo;


        if (!IDjgo || !comentario || !tipo) {

            return res.status(400).json({
                erro: "Dados do comentário incompletos."
            });

        }


        if (tipo !== "like" && tipo !== "dislike") {

            return res.status(400).json({
                erro: "Tipo de opinião inválido."
            });

        }


        conn =
            await pool.getConnection();


        await conn.query(
            `INSERT INTO comentarios
            (IDusr, IDjgo, comentario, tipo)
            VALUES (?, ?, ?, ?)`,
            [
                IDusr,
                IDjgo,
                comentario,
                tipo
            ]
        );


        res.status(201).json({
            mensagem: "Comentário publicado com sucesso."
        });


    } catch (erro) {

        console.error(
            "Erro ao publicar comentário:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao publicar o comentário."
        });


    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/jogo/:id/comentario", async (req, res) => {

    let conn;

    try {

        const idJogo =
            req.params.id;

        conn =
            await pool.getConnection();

        const comentarios =
            await conn.query(
                `SELECT
                    comentarios.comentario,
                    comentarios.tipo,
                    comentarios.IDusr,
                    Cliente.UsrName
                 FROM comentarios
                 INNER JOIN Cliente
                    ON Cliente.IDusr = comentarios.IDusr
                 WHERE comentarios.IDjgo = ?
                 ORDER BY RAND()
                 LIMIT 1`,
                [idJogo]
            );


        if (comentarios.length === 0) {

            return res.status(404).json({
                erro: "Nenhum comentário encontrado."
            });

        }


        res.status(200).json({
            comentario: comentarios[0]
        });


    } catch (erro) {

        console.error(
            "Erro ao carregar comentário:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao carregar comentário."
        });


    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.post("/amizades/pedidos", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDremetente = req.session.usuario.IDusr;
        const IDdestinatario = Number(req.body.IDdestinatario);

        if (
            !Number.isSafeInteger(IDdestinatario) ||
            IDdestinatario <= 0
        ) {
            return res.status(400).json({
                erro: "ID do destinatário inválido."
            });
        }

        if (IDremetente === IDdestinatario) {
            return res.status(400).json({
                erro: "Você não pode enviar um pedido para si mesmo."
            });
        }

        conn = await pool.getConnection();

        const destinatario = await conn.query(
            `SELECT IDusr
             FROM Cliente
             WHERE IDusr = ?
             LIMIT 1`,
            [IDdestinatario]
        );

        if (destinatario.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }
        
        const IDusr1 = Math.min(IDremetente, IDdestinatario);
        const IDusr2 = Math.max(IDremetente, IDdestinatario);

        const amizade = await conn.query(
            `SELECT IDamizade
             FROM amizades
             WHERE IDusr1 = ? AND IDusr2 = ?
             LIMIT 1`,
            [IDusr1, IDusr2]
        );

        if (amizade.length > 0) {
            return res.status(409).json({
                erro: "Vocês já são amigos."
            });
        }
        
        const pedidoRecebido = await conn.query(
            `SELECT IDpedido
             FROM pedidos_amizade
             WHERE IDremetente = ?
               AND IDdestinatario = ?
               AND status = 'pendente'
             LIMIT 1`,
            [IDdestinatario, IDremetente]
        );

        if (pedidoRecebido.length > 0) {
            return res.status(409).json({
                erro: "Este usuário já enviou um pedido para você."
            });
        }

        const pedidosAnteriores = await conn.query(
            `SELECT
                IDpedido,
                status,
                data_atualizacao,
                TIMESTAMPDIFF(
                    SECOND,
                    data_atualizacao,
                    NOW()
                ) AS segundos_decorridos
             FROM pedidos_amizade
             WHERE IDremetente = ?
               AND IDdestinatario = ?
             LIMIT 1`,
            [IDremetente, IDdestinatario]
        );

        if (pedidosAnteriores.length > 0) {

            const pedido = pedidosAnteriores[0];

            if (pedido.status === "pendente") {
                return res.status(409).json({
                    erro: "Você já enviou um pedido para este usuário."
                });
            }

            if (pedido.status === "aceito") {
                return res.status(409).json({
                    erro: "Este pedido já foi aceito."
                });
            }

            if (pedido.status === "recusado") {

                const decorrido = Number(pedido.segundos_decorridos);
                const restante = Math.max(0, 120 - decorrido);

                if (restante > 0) {
                    return res.status(429).json({
                        erro: `Aguarde ${restante} segundo(s) para enviar outro pedido.`
                    });
                }

                await conn.query(
                    `UPDATE pedidos_amizade
                     SET status = 'pendente',
                         data_criacao = NOW(),
                         data_atualizacao = NOW()
                     WHERE IDpedido = ?`,
                    [pedido.IDpedido]
                );

                return res.status(200).json({
                    mensagem: "Pedido de amizade enviado novamente."
                });
            }
        }

        await conn.query(
            `INSERT INTO pedidos_amizade
                (IDremetente, IDdestinatario, status,
                 data_criacao, data_atualizacao)
             VALUES (?, ?, 'pendente', NOW(), NOW())`,
            [IDremetente, IDdestinatario]
        );

        return res.status(201).json({
            mensagem: "Pedido de amizade enviado com sucesso."
        });

    } catch (erro) {

        console.error("Erro ao enviar pedido de amizade:", erro);

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Já existe um pedido de amizade entre essas contas."
            });
        }

        return res.status(500).json({
            erro: "Não foi possível enviar o pedido de amizade."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.get("/amizades/pedidos/recebidos", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDdestinatario = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        const pedidos = await conn.query(
            `SELECT
                p.IDpedido,
                p.IDremetente,
                p.data_criacao,
                c.UsrName,
                c.foto_perfil
             FROM pedidos_amizade AS p
             INNER JOIN Cliente AS c
                ON c.IDusr = p.IDremetente
             WHERE p.IDdestinatario = ?
               AND p.status = 'pendente'
             ORDER BY p.data_criacao DESC`,
            [IDdestinatario]
        );

        return res.status(200).json({
            pedidos: pedidos
        });

    } catch (erro) {

        console.error(
            "Erro ao buscar pedidos recebidos:",
            erro
        );

        return res.status(500).json({
            erro: "Não foi possível carregar os pedidos de amizade."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

async function responderPedidoAmizade(req, res, acao) {

    let conn;
    let transacaoIniciada = false;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDpedido = Number(req.params.IDpedido);

        if (
            !Number.isSafeInteger(IDpedido) ||
            IDpedido <= 0
        ) {
            return res.status(400).json({
                erro: "ID do pedido inválido."
            });
        }

        const IDdestinatario = req.session.usuario.IDusr;

        conn = await pool.getConnection();

        await conn.beginTransaction();
        transacaoIniciada = true;

        const pedidos = await conn.query(
            `SELECT
                IDpedido,
                IDremetente,
                IDdestinatario,
                status
             FROM pedidos_amizade
             WHERE IDpedido = ?
               AND IDdestinatario = ?
             FOR UPDATE`,
            [IDpedido, IDdestinatario]
        );

        if (pedidos.length === 0) {

            await conn.rollback();
            transacaoIniciada = false;

            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        const pedido = pedidos[0];

        if (pedido.status !== "pendente") {

            await conn.rollback();
            transacaoIniciada = false;

            return res.status(409).json({
                erro: "Este pedido já foi respondido."
            });
        }

        if (acao === "aceitar") {

            const IDusr1 = Math.min(
                Number(pedido.IDremetente),
                Number(pedido.IDdestinatario)
            );

            const IDusr2 = Math.max(
                Number(pedido.IDremetente),
                Number(pedido.IDdestinatario)
            );

            const amizadesExistentes = await conn.query(
                `SELECT IDamizade
                 FROM amizades
                 WHERE IDusr1 = ? AND IDusr2 = ?
                 LIMIT 1`,
                [IDusr1, IDusr2]
            );

            if (amizadesExistentes.length === 0) {

                await conn.query(
                    `INSERT INTO amizades
                        (IDusr1, IDusr2)
                     VALUES (?, ?)`,
                    [IDusr1, IDusr2]
                );

            }

            await conn.query(
                `UPDATE pedidos_amizade
                 SET status = 'aceito',
                     data_atualizacao = NOW()
                 WHERE IDpedido = ?`,
                [IDpedido]
            );

            await conn.commit();
            transacaoIniciada = false;

            return res.status(200).json({
                mensagem: "Pedido aceito! Vocês agora são amigos."
            });
        }

        if (acao === "recusar") {

            await conn.query(
                `UPDATE pedidos_amizade
                 SET status = 'recusado',
                     data_atualizacao = NOW()
                 WHERE IDpedido = ?`,
                [IDpedido]
            );

            await conn.commit();
            transacaoIniciada = false;

            return res.status(200).json({
                mensagem: "Pedido de amizade recusado."
            });
        }

        await conn.rollback();
        transacaoIniciada = false;

        return res.status(400).json({
            erro: "Ação inválida."
        });

    } catch (erro) {

        if (conn && transacaoIniciada) {
            try {
                await conn.rollback();
                transacaoIniciada = false;
            } catch (erroRollback) {
                console.error(
                    "Erro ao desfazer a transação:",
                    erroRollback
                );
            }
        }

        console.error(
            "Erro ao responder pedido de amizade:",
            erro
        );

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Essa amizade já existe ou houve um conflito no banco de dados."
            });
        }

        return res.status(500).json({
            erro: "Não foi possível responder ao pedido."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }
}

app.post(
    "/amizades/pedidos/:IDpedido/aceitar",
    async (req, res) => {
        await responderPedidoAmizade(req, res, "aceitar");
    }
);

app.post(
    "/amizades/pedidos/:IDpedido/recusar",
    async (req, res) => {
        await responderPedidoAmizade(req, res, "recusar");
    }
);

app.get("/amizades", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDusuario = req.session.usuario.IDusr;

        conn = await pool.getConnection();
        
        const amigos = await conn.query(
            `SELECT
                c.IDusr,
                c.UsrName,
                c.foto_perfil
             FROM amizades AS a
             INNER JOIN Cliente AS c
                ON c.IDusr = CASE
                    WHEN a.IDusr1 = ? THEN a.IDusr2
                    ELSE a.IDusr1
                END
             WHERE a.IDusr1 = ?
                OR a.IDusr2 = ?
             ORDER BY c.UsrName ASC`,
            [IDusuario, IDusuario, IDusuario]
        );

        return res.status(200).json({
            amigos: amigos
        });

    } catch (erro) {

        console.error(
            "Erro ao buscar lista de amigos:",
            erro
        );

        return res.status(500).json({
            erro: "Não foi possível carregar sua lista de amigos."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.delete("/amizades/:IDamigo", async (req, res) => {

    let conn;

    try {

        if (!req.session.usuario) {
            return res.status(401).json({
                erro: "Você precisa estar logado."
            });
        }

        const IDusuario = Number(req.session.usuario.IDusr);
        const IDamigo = Number(req.params.IDamigo);

        if (
            !Number.isSafeInteger(IDamigo) ||
            IDamigo <= 0
        ) {
            return res.status(400).json({
                erro: "ID do amigo inválido."
            });
        }

        if (IDusuario === IDamigo) {
            return res.status(400).json({
                erro: "Você não pode cancelar uma amizade consigo mesmo."
            });
        }

        const IDusr1 = Math.min(IDusuario, IDamigo);
        const IDusr2 = Math.max(IDusuario, IDamigo);

        conn = await pool.getConnection();

        const resultado = await conn.query(
            `DELETE FROM amizades
             WHERE IDusr1 = ? AND IDusr2 = ?`,
            [IDusr1, IDusr2]
        );

        if (Number(resultado.affectedRows) === 0) {
            return res.status(404).json({
                erro: "Essa amizade não foi encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Amizade cancelada com sucesso."
        });

    } catch (erro) {

        console.error("Erro ao cancelar amizade:", erro);

        return res.status(500).json({
            erro: "Não foi possível cancelar a amizade."
        });

    } finally {

        if (conn) {
            conn.release();
        }

    }

});

app.post("/carrinho", async (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Você precisa entrar na sua conta."
        });
    }

    const IDusr = req.session.usuario.IDusr;
    const IDjogo = Number(req.body.IDjgo);

    if (!Number.isInteger(IDjogo) || IDjogo <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Identificador de jogo inválido."
        });
    }

    let conexao;

    try {
        conexao = await pool.getConnection();

        const jogos = await conexao.query(
            "SELECT IDgme FROM jogos WHERE IDgme = ?",
            [IDjogo]
        );

        if (jogos.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Jogo não encontrado."
            });
        }

        const comprado = await conexao.query(
            `SELECT IDbbtc
             FROM biblioteca
             WHERE IDusr = ? AND IDjgo = ?
             LIMIT 1`,
            [IDusr, IDjogo]
        );

        if (comprado.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Você já possui esse jogo na sua biblioteca."
            });
        }

        await conexao.query(
            `INSERT INTO carrinho (IDusr)
             VALUES (?)
             ON DUPLICATE KEY UPDATE IDusr = VALUES(IDusr)`,
            [IDusr]
        );

        const carrinhos = await conexao.query(
            "SELECT IDcarrinho FROM carrinho WHERE IDusr = ?",
            [IDusr]
        );

        const IDcarrinho = carrinhos[0].IDcarrinho;

        const resultado = await conexao.query(
            `INSERT IGNORE INTO itens_carrinho
             (IDcarrinho, IDjogo)
             VALUES (?, ?)`,
            [IDcarrinho, IDjogo]
        );

        if (resultado.affectedRows === 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Esse jogo já está no seu carrinho."
            });
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: "Jogo adicionado ao carrinho!"
        });

    } catch (erro) {
        console.error("Erro ao adicionar jogo ao carrinho:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Não foi possível adicionar o jogo ao carrinho."
        });

    } finally {
        if (conexao) conexao.release();
    }
});


app.get("/carrinho", async (req, res) => {

    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Você precisa entrar na sua conta."
        });
    }

    const IDusr = req.session.usuario.IDusr;

    let conexao;

    try {
        conexao = await pool.getConnection();

        const itens = await conexao.query(
            `SELECT
                j.IDgme,
                j.Game_Name,
                j.img1,
                j.preco,
                j.desconto,
                ROUND(
                    j.preco * (1 - COALESCE(j.desconto, 0) / 100),
                    2
                ) AS preco_final
            FROM carrinho c
            INNER JOIN itens_carrinho ic
                ON ic.IDcarrinho = c.IDcarrinho
            INNER JOIN jogos j
                ON j.IDgme = ic.IDjogo
            WHERE c.IDusr = ?
            ORDER BY ic.IDitem DESC`,
            [IDusr]
        );

        return res.status(200).json({
            sucesso: true,
            jogos: itens
        });

    } catch (erro) {
        console.error("Erro ao consultar o carrinho:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Não foi possível carregar o carrinho."
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
});

app.delete("/carrinho/:idJogo", async (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Você precisa entrar na sua conta."
        });
    }

    const IDusr = req.session.usuario.IDusr;
    const IDjogo = Number(req.params.idJogo);

    if (!Number.isInteger(IDjogo) || IDjogo <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "ID do jogo inválido."
        });
    }

    let conexao;

    try {
        conexao = await pool.getConnection();

        const resultado = await conexao.query(
            `DELETE ic
             FROM itens_carrinho ic
             INNER JOIN carrinho c
                ON c.IDcarrinho = ic.IDcarrinho
             WHERE c.IDusr = ?
               AND ic.IDjogo = ?`,
            [IDusr, IDjogo]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Esse jogo não foi encontrado no seu carrinho."
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: "Jogo removido do carrinho."
        });

    } catch (erro) {
        console.error("Erro ao remover jogo do carrinho:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Não foi possível remover o jogo do carrinho."
        });
    } finally {
        if (conexao) conexao.release();
    }
});

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

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
