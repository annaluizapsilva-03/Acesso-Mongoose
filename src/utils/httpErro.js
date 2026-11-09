export class ErroDeRequisicao extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export function responderErro(res, e) {
  if (e instanceof ErroDeRequisicao) return res.status(e.status).json({ erro: e.message });
  if (e.name === 'ValidationError' || e.name === 'CastError') return res.status(400).json({ erro: e.message });
  console.error(e);
  return res.status(500).json({ erro: 'Erro interno' });
}

export const arredondar = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;
