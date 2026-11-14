import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para conexão com o frontend React/Vite
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`QualMoto? SAD - Backend NestJS iniciado com sucesso!`);
  logger.log(`Servidor rodando em: http://localhost:${port}`);
  logger.log(`API de Decisão por Grupos: http://localhost:${port}/api/decision/simulate`);
  logger.log(`API de Veículos FIPE: http://localhost:${port}/api/decision/vehicles`);
  logger.log(`====================================================`);
}
bootstrap();

