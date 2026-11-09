import mongoose from 'mongoose';
import Produto from '../models/Produto.js';

const erro = (res, e) => {
  if (e.name === 'ValidationError' || e.name === 'CastError') return res.status(400).json({ erro: e.message });
  console.error(e); return res.status(500).json({ erro: 'Erro interno' });
};

export async function listar(req, res) {
  try { 
    res.json(await Produto.find().sort({ nome: 1 })); 
  } 
  catch(e) { erro(res,e); }
}

export async function obter(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) 
    return res.status(400).json({ erro: 'ID inválido' });
  try { 
    const p = await Produto.findById(req.params.id); 
    return p ? res.json(p) : res.status(404).json({ erro: 'Produto não encontrado' }); 
  } 
  catch(e) { erro(res,e); }
}

export async function criar(req, res) {
  try { 
    res.status(201).json(await Produto.create(req.body));
  } 
  catch(e) { erro(res,e); }
}

export async function atualizar(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) 
    return res.status(400).json({ erro: 'ID inválido' });
  try { 
    const p = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); 
    return p ? res.json(p) : res.status(404).json({ erro: 'Produto não encontrado' }); 
  } 
  catch(e) { erro(res,e); }
}

export async function excluir(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) 
    return res.status(400).json({ erro: 'ID inválido' });

  try { 
    const p = await Produto.findByIdAndDelete(req.params.id); 
    return p ? res.status(204).end() : res.status(404).json({ erro: 'Produto não encontrado' }); 
  } 
  catch(e) { erro(res,e); }
}
