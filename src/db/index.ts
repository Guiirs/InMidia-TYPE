/*
 * Arquivo: /db/index.ts
 *
 * Resumo das Alterações:
 * 1. Adicionado `flattenMaps: true` às configurações globais de `toJSON` e `toObject`.
 * 2. [FIX] Tipado `ret` como `any` nas funções `transform` para corrigir o
 * erro `ts(2790): The operand of a 'delete' operator must be optional`.
 *
 * Motivo das Mudanças:
 * O erro ts(2790) ocorre porque o TypeScript infere `_id` como uma propriedade
 * obrigatória. Ao tipar `ret` como `any` na função `transform`, informamos
 * ao compilador que estamos cientes da manipulação dinâmica do objeto,
 * permitindo o uso do `delete`.
 */

import mongoose, { ConnectOptions } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { config } from '@/config/index'; // Usando alias de path (definido no tsconfig)
import { logger } from '@/config/logger';

/**
 * Aplica transformações globais ao Mongoose.
 * Isso replica a lógica do dbMongo.js original para garantir que:
 * 1. Campos virtuais (como 'id') sejam incluídos em saídas .toJSON().
 * 2. O campo '_id' seja mapeado para 'id'.
 * 3. Os campos '_id' e '__v' (versão) sejam removidos.
 * 4. [MELHORIA] Subdocumentos populados sejam "achatados".
 */
const applyGlobalMongooseSettings = () => {
  mongoose.set('toJSON', {
    virtuals: true,
    flattenMaps: true, // Garante que subdocumentos sejam achatados
    // FIX: Tipar 'ret' como 'any' para permitir 'delete'
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  });

  mongoose.set('toObject', {
    virtuals: true,
    flattenMaps: true, // Garante que subdocumentos sejam achatados
    // FIX: Tipar 'ret' como 'any' para permitir 'delete'
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  });
  logger.info('⚙️ [DB] Mapeamento global Mongoose _id -> id configurado.');
};

/**
 * Estabelece a conexão principal com o MongoDB usando Mongoose.
 */
const connectDB = async (): Promise<void> => {
  // 1. Aplica as configurações globais imediatamente
  applyGlobalMongooseSettings();

  // 2. Adia a conexão se estivermos no ambiente de teste (Jest cuidará disso)
  // (Replicando lógica do dbMongo.js)
  if (config.isTest) {
    logger.info(
      '[DB] Ambiente de teste detectado. Conexão com o banco de dados será gerenciada pelo Jest.',
    );
    return;
  }

  // 3. Define as opções de conexão
  const options: ConnectOptions = {
    // Opções padrão recomendadas
    autoIndex: true, // Habilita a criação de índices (bom para dev)
    serverSelectionTimeoutMS: 5000, // Timeout para seleção do servidor
  };

  // 4. Lógica SSL (Replicando do dbMongo.js)
  // O caminho aponta para 'certs/ca-certificate.pem' na raiz do projeto
  const caPath = path.resolve(process.cwd(), 'certs', 'ca-certificate.pem');

  if (config.isProduction || process.env.DB_SSL === 'true') {
    if (fs.existsSync(caPath)) {
      options.tls = true;
      options.tlsCAFile = caPath;
      logger.info('🔐 [DB] Conexão MongoDB SSL/TLS habilitada com certificado CA.');
    } else {
      logger.warn(
        `⚠️ [DB] Certificado CA SSL não encontrado em ${caPath}. Conectando com tlsInsecure (NÃO SEGURO!).`,
      );
      // Replicando o fallback inseguro do dbMongo.js original
      options.tls = true;
      options.tlsInsecure = true;
    }
  } else {
    logger.info('[DB] Conexão MongoDB SSL/TLS desabilitada (modo dev/test).');
  }

  // 5. Adiciona listeners de eventos do Mongoose
  mongoose.connection.on('connected', () => {
    logger.info('🔌 [DB] Conexão com MongoDB estabelecida.');
  });
  mongoose.connection.on('error', (err) => {
    logger.error(err, '❌ [DB] Erro na conexão com MongoDB:');
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('🔌 [DB] Conexão com MongoDB desconectada.');
  });

  // 6. Tenta a conexão
  try {
    logger.info(`[DB] Conectando ao MongoDB (URI: ${config.MONGODB_URI.substring(0, 20)}...)...`);
    await mongoose.connect(config.MONGODB_URI, options);
  } catch (err) {
    logger.error(err, '❌ [DB] Erro fatal ao conectar com MongoDB na inicialização:');
    process.exit(1); // Encerra a aplicação (replicando dbMongo.js)
  }
};

export default connectDB;