import mongoose from 'mongoose';
const produtoSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  descricao: { type: String, default: '' },
  preco: { type: Number, required: true, min: 0 },
  categoria: { type: String, required: true, trim: true },
  estoque: { type: Number, required: true, min: 0, default: 0 },
  fabricante: { nome: String, pais: String }
}, { timestamps: true });
export default mongoose.model('Produto', produtoSchema);
