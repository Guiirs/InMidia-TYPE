import { Types } from 'mongoose';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

// Repositórios
import {
  placaRepository,
  PlacaRepository,
} from '@/db/repositories/placa.repository';

/**
 * Serviço responsável pela lógica de negócios da API Pública.
 * (Migração de services/publicApiService.js)
 */
export class PublicApiService {
  constructor(private readonly placaRepo: PlacaRepository) {}

  /**
   * Obtém todas as placas marcadas como disponíveis para uma empresa.
   * (Migração de services/publicApiService.js -> getAvailablePlacas)
   *
   * @param empresaId - ID da empresa (vinda do apiKeyAuthMiddleware)
   * @returns Array de placas disponíveis (formatadas).
   */
  async getAvailablePlacas(empresaId: string | Types.ObjectId) {
    logger.info(
      `[PublicApiService] Buscando placas disponíveis para empresa ID: ${empresaId}.`,
    );

    // 1. Usa o repositório de placas para buscar
    // (Utilizamos o findPaginatedByQuery que já criámos,
    // definindo apenas 'disponivel: true' e um limite muito alto,
    // já que o original não tinha paginação)
    const { data: placasDisponiveis } =
      await this.placaRepo.findPaginatedByQuery(empresaId, {
        disponivel: true,
        limit: 10000, // Limite alto para simular "todos"
      });

    // 2. Mapeia o resultado para o formato exato esperado pela API pública
    // (lógica do JS original)
    const resultadoFormatado = placasDisponiveis.map((placa) => ({
      numero_placa: placa.numero_placa || null,
      coordenadas: placa.coordenadas || null,
      nomeDaRua: placa.nomeDaRua || null,
      tamanho: placa.tamanho || null,
      imagem: placa.imagem || null,
      // O repo já popula a região
      regiao: (placa.regiao as any)?.nome || null,
    }));

    return resultadoFormatado;
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const publicApiService = new PublicApiService(placaRepository);