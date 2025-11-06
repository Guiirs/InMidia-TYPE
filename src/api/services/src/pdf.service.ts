import PDFDocument from 'pdfkit';
import { logger } from '@/config/logger';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';

// Importação dos tipos (interfaces) dos nossos modelos
// Usamos 'any' temporariamente onde o populate é complexo, mas idealmente
// criaríamos tipos de DTO específicos para o PDF.
import { IPropostaInterna } from '@/db/models/propostaInterna.model';
import { ICliente } from '@/db/models/cliente.model';
import { IEmpresa } from '@/db/models/empresa.model';
import { IUser } from '@/db/models/user.model';
import { IContrato } from '@/db/models/contrato.model';

// --- CONSTANTES DE LAYOUT (Migração do pdfService.js) ---
const LOGO_PATH = path.join(
  __dirname,
  '..',
  '..', // Sobe de /api/services para /src
  'public',
  'logo_contrato.png', // (Nota: A pasta 'public' deve ser copiada para a raiz do projeto TS)
);
const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const MARGIN = 50; // Margem da página

// Tipos para os dados populados esperados pelos helpers
type TPdfCliente = Partial<ICliente>;
type TPdfEmpresa = Partial<IEmpresa>;
type TPdfUser = Pick<IUser, 'nome' | 'sobrenome'>;
type TPdfPi = IPropostaInterna & {
  placas: (any & { regiao: { nome: string } })[]; // Placas populadas com região
};

/**
 * Helper para desenhar um campo (label + valor)
 * (Migração do pdfService.js)
 */
function drawField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | number | undefined | null,
  x: number,
  y: number,
  labelWidth = 80,
) {
  doc.font(FONT_BOLD).text(label, x, y, { continued: false, width: labelWidth });
  doc
    .font(FONT_REGULAR)
    .text(value || 'N/A', x + labelWidth, y, { width: 200 });
}

/**
 * Helper para desenhar a secção de detalhes (com colunas)
 * (Migração do pdfService.js)
 */
function drawDetailsSection(
  doc: PDFKit.PDFDocument,
  y: number,
  pi: TPdfPi,
  cliente: TPdfCliente,
  user: TPdfUser,
  docId: string,
): number {
  let currentY = y + 10;
  const col1X = MARGIN;
  const col2X = 310;
  const labelWidth = 120; // Mais espaço

  doc.fontSize(10);

  // Linha 1
  drawField(doc, 'Título:', pi.descricao, col1X, currentY, labelWidth);
  drawField(doc, 'Autorização Nº:', docId, col2X, currentY, labelWidth);
  currentY += 20;

  // Linha 2
  drawField(doc, 'Produto:', 'Mídia OOH', col1X, currentY, labelWidth); // (Valor 'N/A' atualizado)
  drawField(
    doc,
    'Data emissão:',
    new Date().toLocaleDateString('pt-BR'),
    col2X,
    currentY,
    labelWidth,
  );
  currentY += 20;

  // Linha 3
  const formatData = (date: Date) =>
    new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const periodo = `${formatData(pi.dataInicio)} a ${formatData(pi.dataFim)}`;
  drawField(doc, 'Período:', periodo, col1X, currentY, labelWidth);
  drawField(
    doc,
    'Contato/Atendimento:',
    `${user.nome} ${user.sobrenome}`,
    col2X,
    currentY,
    labelWidth,
  );
  currentY += 20;

  // Linha 4
  drawField(
    doc,
    'Condições de PGTO:',
    pi.formaPagamento,
    col1X,
    currentY,
    labelWidth,
  );
  drawField(doc, 'Segmento:', cliente.segmento, col2X, currentY, labelWidth);
  currentY += 20;

  return currentY;
}

/**
 * Função principal que desenha o layout do PDF
 * (Migração do pdfService.js)
 */
function generateDynamicPDF(
  res: Response,
  pi: TPdfPi, // PI populada
  cliente: TPdfCliente, // Cliente (vem da PI populada)
  empresa: TPdfEmpresa,
  user: TPdfUser,
  tipoDoc: 'PI' | 'Contrato',
  contrato: Partial<IContrato> | null = null,
) {
  const docId = (tipoDoc === 'PI' ? pi._id : contrato?._id)?.toString() || pi._id.toString();
  const docTitle =
    tipoDoc === 'PI'
      ? 'PROPOSTA INTERNA (PI)'
      : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS';
  const filename = `${tipoDoc}_${docId}_${cliente.nome?.replace(/\s+/g, '_')}.pdf`;

  logger.info(`[PdfService] Gerando ${filename}`);

  // Configura a resposta HTTP
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
  doc.pipe(res);

  // --- 1. CABEÇALHO ---
  try {
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, MARGIN, 40, { width: 150 });
    } else {
      doc.fontSize(10).font(FONT_REGULAR).text('LOGO NÃO ENCONTRADO', MARGIN, 50);
      logger.warn(`[PdfService] Logo não encontrado em ${LOGO_PATH}`);
    }
  } catch (err) {
    logger.error(err, `[PdfService] Erro ao carregar logo:`);
    doc.fontSize(10).font(FONT_REGULAR).text('Erro ao carregar logo', MARGIN, 50);
  }

  doc.fontSize(14).font(FONT_BOLD).text(docTitle, 200, 50, { align: 'right' });
  doc.fontSize(10).font(FONT_REGULAR).text(`${tipoDoc} N°: ${docId}`, 200, 70, { align: 'right' });

  doc.moveTo(MARGIN, 100).lineTo(doc.page.width - MARGIN, 100).stroke();
  let currentY = 115;

  // --- 2. COLUNAS (AGÊNCIA E ANUNCIANTE) ---
  const col1X = MARGIN;
  const col2X = 310;
  const labelWidth = 80;

  doc.fontSize(12).font(FONT_BOLD);
  doc.text('AGÊNCIA (Contratada):', col1X, currentY);
  doc.text('ANUNCIANTE (Contratante):', col2X, currentY);
  currentY += 20;
  doc.fontSize(9).font(FONT_REGULAR);

  // Coluna Agência (Empresa)
  let yAgencia = currentY;
  drawField(doc, 'Razão Social:', empresa.nome, col1X, yAgencia, labelWidth);
  yAgencia += 15;
  drawField(doc, 'Endereço:', empresa.endereco, col1X, yAgencia, labelWidth);
  yAgencia += 15;
  drawField(doc, 'Bairro:', empresa.bairro, col1X, yAgencia, labelWidth);
  yAgencia += 15;
  drawField(doc, 'Cidade:', empresa.cidade, col1X, yAgencia, labelWidth);
  yAgencia += 15;
  drawField(doc, 'CNPJ/CPF:', empresa.cnpj, col1X, yAgencia, labelWidth);
  yAgencia += 15;
  drawField(doc, 'Telefone:', empresa.telefone, col1X, yAgencia, labelWidth);

  // Coluna Anunciante (Cliente)
  let yAnunciante = currentY;
  drawField(doc, 'Razão Social:', cliente.nome, col2X, yAnunciante, labelWidth);
  yAnunciante += 15;
  drawField(doc, 'Endereço:', cliente.endereco, col2X, yAnunciante, labelWidth);
  yAnunciante += 15;
  drawField(doc, 'Bairro:', cliente.bairro, col2X, yAnunciante, labelWidth);
  yAnunciante += 15;
  drawField(doc, 'Cidade:', cliente.cidade, col2X, yAnunciante, labelWidth);
  yAnunciante += 15;
  drawField(doc, 'CNPJ:', cliente.cnpj, col2X, yAnunciante, labelWidth);
  yAnunciante += 15;
  drawField(doc, 'Responsável:', cliente.responsavel, col2X, yAnunciante, labelWidth);

  currentY = Math.max(yAgencia, yAnunciante) + 20;
  doc.moveTo(MARGIN, currentY).lineTo(doc.page.width - MARGIN, currentY).stroke();

  // --- 3. DETALHES (TÍTULO, PERÍODO, PGTO...) ---
  currentY = drawDetailsSection(doc, currentY, pi, cliente, user, docId);
  doc.moveTo(MARGIN, currentY).lineTo(doc.page.width - MARGIN, currentY).stroke();

  // --- 4. PROGRAMAÇÃO (PLACAS) ---
  currentY += 10;
  doc.fontSize(12).font(FONT_BOLD).text('PROGRAMAÇÃO / PLACAS SELECIONADAS:', MARGIN, currentY);
  currentY += 20;
  doc.fontSize(10).font(FONT_REGULAR);

  if (pi.placas && pi.placas.length > 0) {
    pi.placas.forEach((placa) => {
      // (O JS original usava 'placa.codigo', mas o modelo TS usa 'numero_placa')
      const regiao = placa.regiao?.nome || 'N/A';
      const textoPlaca = `- Placa Cód: ${placa.numero_placa} (Região: ${regiao})`;
      doc.text(textoPlaca, MARGIN + 15, currentY);
      currentY += 15;
    });
  } else {
    doc.text('Nenhuma placa selecionada.', MARGIN + 15, currentY);
    currentY += 15;
  }
  currentY += 10;

  // --- 5. VALOR TOTAL ---
  doc.fontSize(12).font(FONT_BOLD).text('VALOR TOTAL:', MARGIN, currentY);
  doc.font(FONT_REGULAR).text(`R$ ${pi.valorTotal.toFixed(2).replace('.', ',')}`, MARGIN + 100, currentY);
  currentY += 30;

  // --- 6. TEXTO LEGAL E ASSINATURAS ---
  let bottomY = doc.page.height - 150;
  const legalText =
    'CONTRATO: Declaro que, neste ato, recebi e tomei ciência e concordei com o teor deste contrato, bem como as condições de pagamento e forma de negociação acima. Em caso de cancelamento o cliente, pagará, a titulo de multa, a quantia de 30% do valor acima ou proporcionalmente ao tempo restante do término do contrato. Em caso de cancelamento, será necessário envio de um documento por escrito e em papel timbrado com no mínimo 30 dias antes do cancelamento.';

  if (currentY > bottomY - 60) {
    bottomY = currentY + 100;
    if (bottomY > doc.page.height - 50) {
      doc.addPage();
      bottomY = 150;
    }
  }

  doc.fontSize(8).text(legalText, MARGIN, bottomY, {
    align: 'justify',
    width: doc.page.width - MARGIN * 2,
  });

  bottomY += 60;

  // Assinaturas
  doc.fontSize(10).font(FONT_REGULAR);
  const signWidth = (doc.page.width - MARGIN * 2 - 40) / 2;
  const signX1 = MARGIN;
  const signX2 = MARGIN + signWidth + 40;

  doc.text('_____________________________________', signX1, bottomY, { width: signWidth, align: 'center' });
  doc.text(empresa.nome || 'Empresa', signX1, bottomY + 15, { width: signWidth, align: 'center' });
  doc.text('CONTRATADA', signX1, bottomY + 30, { width: signWidth, align: 'center' });

  doc.text('_____________________________________', signX2, bottomY, { width: signWidth, align: 'center' });
  doc.text(cliente.nome || 'Cliente', signX2, bottomY + 15, { width: signWidth, align: 'center' });
  doc.text('CONTRATANTE', signX2, bottomY + 30, { width: signWidth, align: 'center' });

  // --- FIM DO DOCUMENTO ---
  doc.end();
  logger.info(`[PdfService] PDF ${filename} enviado para stream.`);
}

/**
 * Exporta a função que gera o PDF da PI
 */
const generatePI_PDF = (
  res: Response,
  pi: TPdfPi,
  cliente: TPdfCliente,
  empresa: TPdfEmpresa,
  user: TPdfUser,
) => {
  generateDynamicPDF(res, pi, cliente, empresa, user, 'PI');
};

/**
 * Exporta a função que gera o PDF do Contrato
 */
const generateContrato_PDF = (
  res: Response,
  contrato: IContrato,
  pi: TPdfPi,
  cliente: TPdfCliente,
  empresa: TPdfEmpresa,
  user: TPdfUser, // O 'user' é quem gerou, (baseado no JS)
) => {
  generateDynamicPDF(res, pi, cliente, empresa, user, 'Contrato', contrato);
};

export const pdfService = {
  generatePI_PDF,
  generateContrato_PDF,
};