# API de Produtos e Vendas — MongoDB Atlas + Mongoose + Express

API REST em Node.js que gerencia **produtos** e **vendas**, relacionando os dois por referência (`ObjectId`), preservando o **preço histórico** de cada venda e gerando um **relatório consolidado**.

## Requisitos

- Node.js 20 ou superior
- Uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas) com um cluster (o plano gratuito é suficiente)

## Configuração

1. No Atlas, em **Database Access**, crie um usuário de banco de dados.
2. Em **Network Access**, autorize o IP da sua máquina.
3. Em **Connect → Drivers**, copie a URI de conexão. Se a senha tiver caracteres especiais, codifique-os na URI (ex.: `@` vira `%40`).
4. Crie o arquivo `.env` a partir do exemplo e preencha `MONGODB_URI`:

   ```bash
   cp .env.example .env
   ```

   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://USUARIO:SENHA@CLUSTER.mongodb.net/nosql_lab?retryWrites=true&w=majority
   ```

   > O `.env` contém credenciais e **não deve ser versionado nem enviado**.

## Executando

```bash
npm install
npm run seed   
npm run dev    
```

Verifique em `GET http://localhost:3000/api/health`. O arquivo `requests.http` reúne exemplos de todas as chamadas (extensão *REST Client* do VS Code; também pode ser usado como referência no Postman).

## Modelagem

### Produto (`src/models/Produto.js`)
Coleção `produtos`: `nome`, `descricao`, `preco`, `categoria`, `estoque`, `fabricante { nome, pais }`.

### Venda (`src/models/Venda.js`)
Coleção `vendas`:

```js
{
  cliente: { nome, email },
  data: Date,                       
  itens: [{
    produto: ObjectId (ref 'Produto'),   
    quantidade: Number,                  
    precoUnitario: Number                
  }],
  total: Number                     
}
```

**Decisões de modelagem**

- **Itens incorporados + produto referenciado.** Os itens só fazem sentido dentro da venda e sempre são lidos junto com ela, então ficam *embutidos* no documento. Já o produto tem vida própria (é editado e consultado separadamente), então é *referenciado* por `ObjectId` e recuperado com `populate('itens.produto')`.
- **Histórico de preços.** No registro da venda, o servidor busca cada produto no banco e **copia o preço atual** para `precoUnitario`. Alterar o preço do produto depois não afeta vendas já feitas. Qualquer preço enviado pelo cliente na requisição é **ignorado**.
- **Total derivado.** `total` é recalculado a cada validação a partir dos itens, nunca recebido do cliente.

## Endpoints

### Produtos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Status da conexão com o MongoDB |
| GET | `/api/produtos` | Lista produtos |
| GET | `/api/produtos/:id` | Detalha um produto |
| POST | `/api/produtos` | Cadastra produto |
| PUT | `/api/produtos/:id` | Atualiza produto |
| DELETE | `/api/produtos/:id` | Exclui produto |

### Vendas
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/vendas` | Registra uma venda |
| GET | `/api/vendas` | Lista vendas (mais recentes primeiro) com `populate` dos produtos |
| GET | `/api/vendas/:id` | Detalha uma venda com `populate` dos produtos |

Filtros opcionais em `GET /api/vendas`: `?cliente=ana` (busca parcial, sem diferenciar maiúsculas), `?de=2026-01-01&ate=2026-12-31`.

**Exemplo — registrar venda**

```http
POST /api/vendas
Content-Type: application/json

{
  "cliente": { "nome": "Ana Souza", "email": "ana@exemplo.com" },
  "itens": [
    { "produto": "<ID_DO_PRODUTO_1>", "quantidade": 2 },
    { "produto": "<ID_DO_PRODUTO_2>", "quantidade": 1 }
  ]
}
```

Validações (resposta `400`, ou `404` para produto inexistente): nome do cliente obrigatório, ao menos um item, `produto` com ID válido, `quantidade` inteira ≥ 1 e produto existente no catálogo. Itens repetidos do mesmo produto são agrupados somando as quantidades.

### Relatório consolidado

`GET /api/relatorios/vendas`

Parâmetros opcionais: `de`, `ate` (datas ISO) e `limite` (quantidade de produtos no ranking; padrão 5, máximo 50).

```json
{
  "periodo": { "de": null, "ate": null },
  "quantidadeVendas": 2,
  "unidadesVendidas": 7,
  "faturamentoTotal": 2520.5,
  "ticketMedio": 1260.25,
  "produtosMaisVendidos": [
    { "produtoId": "...", "nome": "Mouse", "categoria": "Acessórios", "unidadesVendidas": 4, "faturamento": 340 }
  ]
}
```

O relatório usa o *aggregation pipeline* do MongoDB (`$match`, `$facet`, `$unwind`, `$group`, `$lookup`). O faturamento é calculado com o **`precoUnitario` gravado na venda**, e não com o preço atual do produto. Os produtos são ordenados por unidades vendidas (desempate por faturamento). Se um produto vendido tiver sido excluído do catálogo, ele aparece como `(produto removido)`, e os valores continuam corretos.

## Como verificar o histórico de preços

1. Cadastre um produto com `preco: 80` e registre uma venda dele.
2. Altere o produto: `PUT /api/produtos/:id` com `{ "preco": 100 }`.
3. Registre uma segunda venda do mesmo produto.
4. Em `GET /api/vendas`, a primeira venda continua com `precoUnitario: 80` e a segunda com `100`, enquanto `produto.preco` (populado) mostra 100 nas duas. O relatório soma 80 e 100 conforme cada venda.

## Estrutura

```
src/
  app.js                         # Express e rotas
  server.js                      # inicialização
  config/database.js             # conexão com o Atlas
  models/Produto.js
  models/Venda.js
  controllers/produtoController.js
  controllers/vendaController.js
  controllers/relatorioController.js
  routes/produtoRoutes.js
  routes/vendaRoutes.js
  routes/relatorioRoutes.js
  utils/httpErro.js              # tratamento de erros e arredondamento
scripts/seed.js                  # produtos de exemplo
requests.http                    # exemplos de requisições
```

## Limitações conhecidas (fora do escopo)

Controle de estoque, transações multi-documento, autenticação, concorrência e políticas para excluir produtos já vendidos não foram implementados. Em produção, seria recomendável tratar esses pontos (por exemplo, "arquivar" produtos em vez de excluí-los).
