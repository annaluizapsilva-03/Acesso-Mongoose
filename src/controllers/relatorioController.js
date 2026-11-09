import Produto from '../models/Produto.js';
import Venda from '../models/Venda.js';
import { ErroDeRequisicao, responderErro, arredondar } from '../utils/httpErro.js';


export async function relatorioVendas(req, res) {
  try {
    const { de, ate } = req.query;
    const limite = req.query.limite === undefined ? 5 : Number(req.query.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > 50)
      throw new ErroDeRequisicao('"limite" deve ser um inteiro entre 1 e 50');

    const filtroData = {};
    if (de) filtroData.$gte = new Date(de);
    if (ate) filtroData.$lte = new Date(ate);
    if (Object.values(filtroData).some((d) => Number.isNaN(d.getTime())))
      throw new ErroDeRequisicao('Datas inválidas: use o formato ISO (ex.: 2025-01-31)');

    const receitaDoItem = { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] };

    const [resultado] = await Venda.aggregate([
      { $match: Object.keys(filtroData).length ? { data: filtroData } : {} },
      {
        $facet: {
          vendas: [{ $count: 'quantidade' }],
          totais: [
            { $unwind: '$itens' },
            {
              $group: {
                _id: null,
                faturamento: { $sum: receitaDoItem },
                unidades: { $sum: '$itens.quantidade' }
              }
            }
          ],
          topProdutos: [
            { $unwind: '$itens' },
            {
              $group: {
                _id: '$itens.produto',
                unidadesVendidas: { $sum: '$itens.quantidade' },
                faturamento: { $sum: receitaDoItem }
              }
            },
            { $sort: { unidadesVendidas: -1, faturamento: -1, _id: 1 } },
            { $limit: limite },
            { $lookup: { from: Produto.collection.name, localField: '_id', foreignField: '_id', as: 'produto' } },
            {
              $project: {
                _id: 0,
                produtoId: '$_id',
                nome: { $ifNull: [{ $arrayElemAt: ['$produto.nome', 0] }, '(produto removido)'] },
                categoria: { $arrayElemAt: ['$produto.categoria', 0] },
                unidadesVendidas: 1,
                faturamento: 1
              }
            }
          ]
        }
      }
    ]);

    const totais = resultado.totais[0] ?? { faturamento: 0, unidades: 0 };
    const quantidadeVendas = resultado.vendas[0]?.quantidade ?? 0;

    res.json({
      periodo: { de: de ?? null, ate: ate ?? null },
      quantidadeVendas,
      unidadesVendidas: totais.unidades,
      faturamentoTotal: arredondar(totais.faturamento),
      ticketMedio: quantidadeVendas ? arredondar(totais.faturamento / quantidadeVendas) : 0,
      produtosMaisVendidos: resultado.topProdutos.map((p) => ({ ...p, faturamento: arredondar(p.faturamento) }))
    });
  } catch (e) { responderErro(res, e); }
}
