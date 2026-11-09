# API de Produtos e Vendas

Projeto da atividade de NoSQL. É uma API feita com Node.js, Express, Mongoose e MongoDB Atlas para cadastrar produtos, registrar vendas e gerar um relatório.

## Como rodar

1. Instale o Node.js (versão 20 ou mais nova).
2. Crie um cluster no MongoDB Atlas, um usuário de banco e libere o seu IP em *Network Access*.
3. Copie a string de conexão do Atlas (Connect → Drivers).
4. Copie o arquivo `.env.example` para `.env` e coloque a sua string em `MONGODB_URI`:

```
PORT=3000
MONGODB_URI=mongodb+srv://USUARIO:SENHA@CLUSTER.mongodb.net/nosql_lab?retryWrites=true&w=majority
```

5. No terminal, rode:

```bash
npm install
npm run seed
npm run dev
```

O `npm run seed` cadastra alguns produtos de exemplo (pode pular se quiser cadastrar na mão).

Para ver se funcionou, abra `http://localhost:3000/api/health`.

## Como funciona

**Produto:** nome, descrição, preço, categoria, estoque e fabricante.

**Venda:** tem o cliente, a data e uma lista de itens. Cada item tem:
- `produto`: o ID do produto (referência, `ObjectId`)
- `quantidade`
- `precoUnitario`: o preço do produto **na hora da venda**

Por isso, se o preço do produto mudar depois, as vendas antigas continuam com o preço que foi cobrado na época. O preço é copiado do banco pelo servidor, então o preço enviado pelo cliente é ignorado.

O `total` da venda é calculado automaticamente (quantidade × preço unitário de cada item).

## Rotas

### Produtos
| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/produtos` | lista os produtos |
| GET | `/api/produtos/:id` | busca um produto |
| POST | `/api/produtos` | cadastra um produto |
| PUT | `/api/produtos/:id` | atualiza um produto |
| DELETE | `/api/produtos/:id` | exclui um produto |

### Vendas
| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/vendas` | registra uma venda |
| GET | `/api/vendas` | lista as vendas (com os dados dos produtos, usando `populate`) |
| GET | `/api/vendas/:id` | busca uma venda |

Exemplo de corpo para registrar uma venda:

```json
{
  "cliente": { "nome": "Ana Souza", "email": "ana@exemplo.com" },
  "itens": [
    { "produto": "ID_DO_PRODUTO_1", "quantidade": 2 },
    { "produto": "ID_DO_PRODUTO_2", "quantidade": 1 }
  ]
}
```

A API recusa a venda se: não tiver nome do cliente, não tiver itens, o ID do produto for inválido ou não existir, ou a quantidade não for um número inteiro maior que 0.



## Testando o preço histórico

1. Cadastre um produto com preço 80 e faça uma venda dele.
2. Mude o preço dele para 100 (`PUT /api/produtos/:id`).
3. Faça outra venda do mesmo produto.
4. Em `GET /api/vendas`, a primeira venda continua com `precoUnitario` 80 e a segunda com 100.

Tem exemplos prontos de todas as requisições no arquivo `requests.http`.




