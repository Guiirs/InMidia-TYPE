import mongoose, { Types } from 'mongoose';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';
import { config } from '@/config/index';

// Repositórios
import {
  aluguelRepository,
  AluguelRepository,
} from '@/db/repositories/aluguel.repository';
import {
  placaRepository,
  PlacaRepository,
} from '@/db/repositories/placa.repository';
// (O original validava Placa e Cliente, mas a validação Zod já faz isso)

// DTOs
import { CreateAluguelDto } from '@/utils/validators/aluguel.validator';
import { IAluguel } from '@/db/models/aluguel.model';

/**
 * Serviço responsável pela lógica de negócios de Aluguéis (Reservas).
 * (Migração de services/aluguelService.js)
 */
export class AluguelService {
  // Define se as transações devem ser usadas (desabilitadas em 'test')
  private useTransactions: boolean;

  constructor(
    private readonly aluguelRepo: AluguelRepository,
    private readonly placaRepo: PlacaRepository,
  ) {
    // Desativa transações APENAS em teste (replicando JS original)
    this.useTransactions = !config.isTest;
    if (!this.useTransactions) {
      logger.warn(
        '[AluguelService] TRANSAÇÕES MONGOOSE DESABILITADAS (Ambiente de Teste)',
      );
    }
  }

  /**
   * Helper: Pega a data de hoje com horas zeradas (UTC)
   */
  private getHoje(): Date {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    return hoje;
  }

  /**
   * Helper: Zera as horas de uma data (UTC)
   */
  private zeroDate(date: Date): Date {
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Obtém todos os alugueis para uma placa específica.
   * (Migração de services/aluguelService.js -> getAlugueisByPlaca)
   */
  async getAlugueisByPlaca(
    placaId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<IAluguel[]> {
    logger.info(
      `[AluguelService] Buscando aluguéis para placa ${placaId} (Empresa ${empresaId}).`,
    );
    // O repositório já popula e ordena
    const alugueis = await this.aluguelRepo.findByPlacaId(placaId, empresaId);
    // O .toJSON() global (do db/index) cuida da formatação
    return alugueis.map((a) => a.toJSON());
  }

  /**
   * Cria um novo aluguel (reserva) para uma placa, usando transação.
   * (Migração de services/aluguelService.js -> createAluguel)
   */
  async createAluguel(
    dto: CreateAluguelDto,
    empresaId: string | Types.ObjectId,
  ): Promise<IAluguel> {
    logger.info(`[AluguelService] Tentando criar aluguel para empresa ${empresaId}.`);

    // 1. Zera as horas das datas (lógica do JS)
    const inicioDate = this.zeroDate(new Date(dto.data_inicio));
    const fimDate = this.zeroDate(new Date(dto.data_fim));

    // 2. Inicia a sessão Mongoose (se não estiver em teste)
    const session = this.useTransactions
      ? await mongoose.startSession()
      : null;
    if (session) session.startTransaction();

    try {
      // 3. Verifica conflitos (lógica do JS)
      const conflictingAluguel = await this.aluguelRepo.findConflicting(
        dto.placa_id,
        empresaId,
        inicioDate,
        fimDate,
        session,
      );

      if (conflictingAluguel) {
        throw new HttpError(
          `Esta placa já está reservada total ou parcialmente no período solicitado.`,
          409, // Conflict
        );
      }

      // 4. Cria o aluguel
      const novoAluguel = await this.aluguelRepo.create(
        {
          placa: new Types.ObjectId(dto.placa_id),
          cliente: new Types.ObjectId(dto.cliente_id),
          empresa: new Types.ObjectId(empresaId),
          data_inicio: inicioDate,
          data_fim: fimDate,
        },
        session as mongoose.ClientSession, // TS precisa de cast aqui
      );
      logger.info(`[AluguelService] Aluguel ${novoAluguel.id} criado na transação.`);

      // 5. Verifica se o aluguel é ativo hoje e atualiza a placa
      // (lógica do JS)
      const hoje = this.getHoje();
      const isAtivoHoje =
        inicioDate.getTime() <= hoje.getTime() &&
        fimDate.getTime() >= hoje.getTime();

      if (isAtivoHoje) {
        logger.debug(`[AluguelService] Aluguel ${novoAluguel.id} ATIVO hoje. Marcando placa ${dto.placa_id} como indisponível.`);
        const result = await this.placaRepo.updateDisponibilidade(
          dto.placa_id,
          empresaId,
          false, // Marcar como indisponível
          session,
        );
        if (result.matchedCount === 0) {
          throw new HttpError(
            `Placa ${dto.placa_id} não encontrada para atualização de status.`,
            404,
          );
        }
      }

      // 6. Commita a transação
      if (session) await session.commitTransaction();

      logger.info(`[AluguelService] Aluguel ${novoAluguel.id} processado com sucesso.`);
      // O repo 'create' já popula o cliente
      return novoAluguel.toJSON();
    } catch (error) {
      if (session) await session.abortTransaction();
      logger.error(error, '[AluguelService] Erro ao criar aluguel');
      throw error; // Repassa o HttpError (409, 404) ou outros
    } finally {
      if (session) session.endSession();
    }
  }

  /**
   * Apaga um aluguel (cancela reserva) e atualiza o status da placa.
   * (Migração de services/aluguelService.js -> deleteAluguel)
   */
  async deleteAluguel(
    aluguelId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<{ success: boolean; message: string }> {
    logger.info(`[AluguelService] Tentando apagar aluguel ${aluguelId}.`);

    const session = this.useTransactions
      ? await mongoose.startSession()
      : null;
    if (session) session.startTransaction();

    try {
      // 1. Encontra o aluguel
      const aluguel = await this.aluguelRepo.findById(
        aluguelId,
        empresaId,
        session,
      );
      if (!aluguel) {
        throw new HttpError('Aluguel não encontrado.', 404);
      }
      const { placa: placaId, data_inicio, data_fim } = aluguel;

      // 2. Apaga o aluguel
      await this.aluguelRepo.deleteOne(aluguelId, empresaId, session);
      logger.info(`[AluguelService] Aluguel ${aluguelId} apagado na transação.`);

      // 3. Verifica se era ativo hoje (lógica do JS)
      const hoje = this.getHoje();
      const eraAtivoHoje =
        this.zeroDate(new Date(data_inicio)).getTime() <= hoje.getTime() &&
        this.zeroDate(new Date(data_fim)).getTime() >= hoje.getTime();

      // 4. Se era ativo, verifica se há *outros* aluguéis ativos para a placa
      if (eraAtivoHoje) {
        const outroAluguelAtivo = await this.aluguelRepo.findActiveByPlaca(
          placaId,
          empresaId,
          hoje,
          session,
        );

        // 5. Se não houver outros, torna a placa disponível
        if (!outroAluguelAtivo) {
          logger.debug(`[AluguelService] Nenhum outro aluguel ativo. Marcando placa ${placaId} como disponível.`);
          await this.placaRepo.updateDisponibilidade(
            placaId,
            empresaId,
            true, // Marcar como disponível
            session,
          );
        } else {
          logger.debug(`[AluguelService] Outro aluguel ativo (ID: ${outroAluguelAtivo._id}) encontrado. Mantendo placa indisponível.`);
        }
      }

      // 6. Commita a transação
      if (session) await session.commitTransaction();

      logger.info(`[AluguelService] Aluguel ${aluguelId} apagado com sucesso.`);
      return { success: true, message: 'Aluguel cancelado com sucesso.' };
    } catch (error) {
      if (session) await session.abortTransaction();
      logger.error(error, `[AluguelService] Erro ao apagar aluguel ${aluguelId}`);
      throw error; // Repassa o HttpError (404) ou outros
    } finally {
      if (session) session.endSession();
    }
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const aluguelService = new AluguelService(
  aluguelRepository,
  placaRepository,
);