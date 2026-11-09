# PlayOld

Projeto PlayOld: interface web e backend Node.js/Express.

## Estrutura
- `backend/`: API Express e conexão MariaDB.
- Demais pastas: páginas, scripts, estilos e imagens do site.

## Executar localmente
1. Instale Node.js 20 ou superior e MariaDB.
2. Entre na pasta `backend` e execute `npm install`.
3. Copie `.env.example` para `.env` e preencha as configurações do banco e do Cloudinary.
4. Execute `npm start` dentro de `backend`.
5. Acesse `http://localhost:3000/Home/Home.html`.

Não envie o arquivo `.env` ao GitHub. As variáveis de ambiente também precisam ser cadastradas no serviço de hospedagem.

## Hospedagem
O servidor usa a variável `PORT` fornecida pelo serviço de hospedagem e as variáveis `DB_*`, `SESSION_SECRET` e `CLOUDINARY_*` para configurar os serviços externos.
