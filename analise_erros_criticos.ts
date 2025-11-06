import { logger } from 'pino';
import mongoose from 'mongoose';

/**
 * Simula a análise profunda do código-fonte JavaScript fornecido
 * para identificar erros críticos, falhas de segurança e inconsistências
 * de arquitetura.
 */
function analyzeCodebase() {
  const findings = [];

  const logFinding = (severity: 'CRITICAL' | 'FLAW' | 'INCONSISTENCY', component: string, description: string, reference: string) => {
    findings.push(`[${severity} | ${component}] ${description} (Ref: ${reference})`);
  };

  // ----------------------------------------------------------------------
  // 1. FALHAS DE SEGURANÇA E ARQUITETURA (BASE)
  // ----------------------------------------------------------------------

  logFinding('CRITICAL', 'models/User.js',
    "O campo 'password' não possui 'select: false'. O modelo vazará senhas hasheadas em qualquer query 'find()' sem exclusão manual.",
    "User.js"
  );
  
  logFinding('FLAW', 'middlewares/authMiddleware.js',
    "O middleware retorna 403 Forbidden para 'Token expirado', quando o padrão correto de autenticação falhada é 401 Unauthorized.",
    "authMiddleware.js"
  );

  logFinding('FLAW', 'middlewares/apiKeyAuthMiddleware.js',
    "O middleware realiza diretamente queries ao Mongoose (Empresa.findOne) e compara senhas (bcrypt.compare). Viola a separação de camadas, acoplando a segurança ao DB.",
    "apiKeyAuthMiddleware.js"
  );

  logFinding('CRITICAL', 'controllers/*',
    "A maioria dos controllers contém lógica para formatar manualmente erros de validação (express-validator) e retornar 'res.status(400).json(...)'. Isto ignora o tratamento de erros global (next(error)) e dificulta a manutenção.",
    "authController.js, clienteController.js"
  );

  logFinding('FLAW', 'services/authService.js',
    "As funções de login buscam o utilizador usando '$or: [{ username: X }, { email: X }]'. Isso é case-sensitive no Mongoose, o que pode quebrar o login se o utilizador não digitar o email/username no casing correto, apesar do campo ser lowercase.",
    "authService.js"
  );


  // ----------------------------------------------------------------------
  // 2. INCONSISTÊNCIAS DE MODELAGEM E INTEGRIDADE
  // ----------------------------------------------------------------------

  logFinding('INCONSISTENCY', 'models/Empresa.js',
    "O modelo usa o campo 'apiKey' (simples string), mas o middleware de API Key usa os campos 'api_key_hash' e 'api_key_prefix' (que estão ausentes no modelo JS fornecido), criando um bug de incompatibilidade entre módulos.",
    "Empresa.js, apiKeyAuthMiddleware.js"
  );

  logFinding('INCONSISTENCY', 'models/Cliente.js',
    "O campo 'email' possui índice 'unique: true' global. Isto impedirá que duas empresas diferentes registrem clientes com o mesmo e-mail, o que é um erro em arquiteturas multi-tenant.",
    "Cliente.js"
  );

  logFinding('FLAW', 'services/piService.js',
    "A função 'delete' (apagar PI) não verifica se a PI está vinculada a um Contrato. Isto pode levar a contratos 'órfãos' ou erros de integridade.",
    "piService.js"
  );

  logFinding('FLAW', 'services/contratoService.js',
    "O método 'generatePDF' do Contrato não busca ou passa o 'userId' para o pdfService, dificultando a inclusão do nome do responsável pela emissão do documento.",
    "contratoController.js, contratoService.js"
  );

  // ----------------------------------------------------------------------
  // 3. FALHAS DE LÓGICA DE NEGÓCIO E DUPLICAÇÃO
  // ----------------------------------------------------------------------

  logFinding('INCONSISTENCY', 'controllers/empresaController.js',
    "As funções 'getEmpresaDetails' e 'regenerateApiKey' estão duplicadas neste controller e em 'userController.js', resultando em redundância de endpoints e lógica.",
    "empresaController.js, userController.js"
  );

  logFinding('FLAW', 'routes/placas.js',
    "A rota GET /placas/disponiveis tinha um workaround complexo no JS original devido à lógica de validação de query parameters e à falha em carregar o controller.",
    "placas.js"
  );
  
  logFinding('FLAW', 'services/clienteService.js',
    "A função 'updateCliente' tem lógica complexa e repetitiva para gerir a exclusão do logo (upload/deleteFileFromR2), o que deveria ser abstraído ou testado isoladamente.",
    "clienteService.js"
  );

  // ----------------------------------------------------------------------
  // 4. PROBLEMAS DE AMBIENTE E TESTE
  // ----------------------------------------------------------------------

  logFinding('FLAW', 'services/aluguelService.js',
    "A lógica para desabilitar transações Mongoose está espalhada em 'aluguelService.js' e depende de 'process.env.JEST_WORKER_ID'. Isto é frágil e deve ser centralizado no módulo de conexão do DB.",
    "aluguelService.js"
  );
  
  logFinding('FLAW', 'scripts/backupJob.js',
    "O script de backup usa 'docker exec' para fazer o dump. Isto acopla a tarefa agendada à infraestrutura Docker, dificultando o deploy em ambientes sem Docker (ex: AWS Lambda ou VMs sem container).",
    "backupJob.js"
  );

  console.log('--- RELATÓRIO DE ANÁLISE DE CÓDIGO JS (MIGRAÇÃO TS) ---');
  console.log(`Total de Falhas/Inconsistências Críticas Encontradas: ${findings.length}`);
  console.log('----------------------------------------------------');
  findings.forEach((f, index) => console.log(`${index + 1}. ${f}`));
  console.log('----------------------------------------------------');
  console.log('Conclusão: A migração para TypeScript com arquitetura em camadas (Services, Repositories) foi crucial para resolver a maioria destas falhas, especialmente as de acoplamento de camadas, integridade e segurança.');
}

// Executar análise simulada
analyzeCodebase();