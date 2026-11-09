import mongoose from 'mongoose';
import Produto from '../models/Produto.js';
import Venda from '../models/Venda.js';
import { ErroDeRequisicao, responderErro } from '../utils/httpErro.js';

function normalizarItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0)
    throw new ErroDeRequisicao('Informe ao menos um item em "itens"');

  const porProduto = new Map();
  for (const [i, item] of itens.entries()) {
    const id = item?.produto;
    if (!mongoose.isValidObjectId(id) || typeof id !== 'string')
      throw new ErroDeRequisicao(`Item ${i + 1}: "produto" deve ser um ID válido`);
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1)
      throw new ErroDeRequisicao(`Item ${i + 1}: "quantidade" deve ser um inteiro maior ou igual a 1`);
    porProduto.set(id, (porProduto.get(id) ?? 0) + item.quantidade);
  }
  return [...porProduto].map(([produto, quantidade]) => ({ produto, quantidade }));
}

export async function criar(req, res) {
  try {
    const { cliente, data, itens } = req.body ?? {};

    if (typeof cliente?.nome !== 'string' || !cliente.nome.trim())
      throw new ErroDeRequisicao('Informe o nome do cliente em "cliente.nome"');

    const itensNormalizados = normalizarItens(itens);

    const ids = itensNormalizados.map((i) => i.produto);
    const produtos = await Produto.find({ _id: { $in: ids } }).select('preco');
    const precoPorId = new Map(produtos.map((p) => [p.id, p.preco]));

    const inexistentes = ids.filter((id) => !precoPorId.has(id));
    if (inexistentes.length)
      throw new ErroDeRequisicao(`Produto(s) não encontrado(s): ${inexistentes.join(', ')}`, 404);

    const venda = await Venda.create({
      cliente: { nome: cliente.nome, email: cliente.email },
      data: data ?? undefined,
      itens: itensNormalizados.map((i) => ({ ...i, precoUnitario: precoPorId.get(i.produto) }))
    });

    const completa = await venda.populate('itens.produto');
    res.status(201).json(completa);
  } catch (e) { responderErro(res, e); }
}

export async function listar(req, res) {
  try {
    const filtro = {};
    const { cliente, de, ate } = req.query;

    if (cliente) filtro['cliente.nome'] = { $regex: String(cliente).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (de || ate) {
      filtro.data = {};
      if (de) filtro.data.$gte = new Date(de);
      if (ate) filtro.data.$lte = new Date(ate);
      if (Object.values(filtro.data).some((d) => Number.isNaN(d.getTime())))
        throw new ErroDeRequisicao('Datas inválidas: use o formato ISO (ex.: 2025-01-31)');
    }

    const vendas = await Venda.find(filtro).sort({ data: -1 }).populate('itens.produto');
    res.json(vendas);
  } catch (e) { responderErro(res, e); }
}

export async function obter(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ErroDeRequisicao('ID inválido');
    const venda = await Venda.findById(req.params.id).populate('itens.produto');
    if (!venda) throw new ErroDeRequisicao('Venda não encontrada', 404);
    res.json(venda);
  } catch (e) { responderErro(res, e); }
}
