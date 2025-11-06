/**
 * Barrel file para a camada de Controladores (Controllers).
 * Exporta todos os controladores principais.
 *
 * @nota Os caminhos foram ajustados de './src/...' para './...'
 * para remover um nível de aninhamento desnecessário (src/api/controllers/src/*)
 * e seguir melhores práticas de organização de módulos.
 */

export * from './src/auth.controller';
export * from './src/user.controller';
export * from './src/admin.controller';
export * from './src/empresa.controller';
export * from './src/regiao.controller';
export * from './src/placa.controller';
export * from './src/cliente.controller';
export * from './src/aluguel.controller';
export * from './src/pi.controller';
export * from './src/contrato.controller';
export * from './src/public.controller';
export * from './src/relatorio.controller';