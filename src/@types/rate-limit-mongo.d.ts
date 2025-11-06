/**
 * Declaração de tipos compatível com:
 * - express-rate-limit v7.x
 * - rate-limit-mongo v2.3.2
 *
 * Corrige o conflito de tipagem entre Store e LegacyStore.
 */

declare module 'rate-limit-mongo' {
  import type { Store, IncrementResponse } from 'express-rate-limit';
  import type { Collection, MongoClientOptions } from 'mongodb';

  interface RateLimitMongoOptions {
    uri?: string;
    user?: string;
    password?: string;
    dbName?: string;
    collectionName?: string;
    expireTimeMs?: number;
    errorHandler?: (err: Error) => void;
    collection?: Collection;
    clientOptions?: MongoClientOptions;
  }

  /**
   * Implementação compatível com express-rate-limit v7.
   */
  export default class MongoStore implements Store {
    constructor(options: RateLimitMongoOptions);

    /**
     * Incrementa o contador (promessa ou callback compatível)
     */
    incr(key: string): Promise<IncrementResponse> | void;

    /**
     * Opcional no rate-limit-mongo, mas declarado aqui
     * para satisfazer a interface LegacyStore do express-rate-limit.
     */
    decrement(key: string): void; // ✅ obrigatório agora

    /**
     * Reseta o contador para uma chave.
     */
    resetKey(key: string): void;

    /**
     * Reseta todos (opcional).
     */
    resetAll?(): void;

    /**
     * Inicializa o store (não usada no rate-limit-mongo).
     */
    init?(): void;
  }
}
