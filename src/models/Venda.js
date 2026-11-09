import mongoose from 'mongoose';

const itemVendaSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  quantidade: {
    type: Number,
    required: true,
    min: [1, 'A quantidade deve ser no mínimo 1'],
    validate: { validator: Number.isInteger, message: 'A quantidade deve ser um número inteiro' }
  },
  precoUnitario: { type: Number, required: true, min: 0 }
}, { _id: false });

itemVendaSchema.virtual('subtotal').get(function () {
  return Math.round((this.quantidade * this.precoUnitario + Number.EPSILON) * 100) / 100;
});

const vendaSchema = new mongoose.Schema({
  cliente: {
    nome: { type: String, required: [true, 'O nome do cliente é obrigatório'], trim: true },
    email: { type: String, trim: true, lowercase: true }
  },
  data: { type: Date, default: Date.now },
  itens: {
    type: [itemVendaSchema],
    validate: { validator: (itens) => itens.length > 0, message: 'A venda deve ter pelo menos um item' }
  },
  total: { type: Number, min: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

vendaSchema.pre('validate', function (next) {
  const soma = this.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);
  this.total = Math.round((soma + Number.EPSILON) * 100) / 100;
  next();
});

vendaSchema.index({ data: -1 });

export default mongoose.model('Venda', vendaSchema);
