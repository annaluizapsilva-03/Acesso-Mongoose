import 'dotenv/config';
import mongoose from 'mongoose';
import { conectarBanco } from '../src/config/database.js';
import Produto from '../src/models/Produto.js';

const produtos = [
  ['Notebook 14', 3500, 'Informática', 12, 'TechBrasil'],
  ['Mouse sem fio', 80, 'Acessórios', 50, 'Periféricos SA'],
  ['Teclado mecânico', 280, 'Acessórios', 24, 'Periféricos SA'],
  ['Monitor 24 polegadas', 950, 'Informática', 18, 'Visão Tech'],
  ['Webcam HD', 220, 'Acessórios', 30, 'Visão Tech'],
  ['Headset USB', 190, 'Áudio', 28, 'Som Brasil'],
  ['Caixa Bluetooth', 320, 'Áudio', 16, 'Som Brasil'],
  ['SSD 1TB', 480, 'Componentes', 22, 'Armazena'],
  ['Memória RAM 16GB', 350, 'Componentes', 35, 'Armazena'],
  ['Hub USB-C', 150, 'Acessórios', 40, 'TechBrasil']
].map(([nome, preco, categoria, estoque, fabricante]) => ({ nome, preco, categoria, estoque, descricao: `Produto de exemplo: ${nome}`, fabricante: { nome: fabricante, pais: 'Brasil' } }));
try {
  await conectarBanco();
  // Atualiza ou cria pelo nome; não apaga dados de alunos.
  for (const produto of produtos) await Produto.updateOne({ nome: produto.nome }, { $setOnInsert: produto }, { upsert: true });
  console.log('Produtos de exemplo disponíveis:', produtos.length);
}
catch (e) { console.error(e.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
