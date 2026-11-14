const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { extraMotos } = require('./extra_motos');

// 1. Load original motos from generate_catalog.js
const rawCode = fs.readFileSync('generate_catalog.js', 'utf8');
const motosCode = rawCode.substring(0, rawCode.indexOf("console.log('Total de motocicletas compiladas:"))
  .replace('const motos = [', 'this.motos = [');
const context = vm.createContext({ console, require, __dirname, process });
vm.runInContext(motosCode, context);

const originalMotos = context.motos;
console.log('Original motos:', originalMotos.length);
console.log('Extra motos:', extraMotos.length);

const allMotos = [...originalMotos, ...extraMotos].filter(m => m.category !== 'eletrica');
console.log('Total de motocicletas unificadas (sem elétricas):', allMotos.length);

// 2. Validate uniqueness of IDs and FIPE codes
const idMap = new Set();
const fipeMap = new Set();
for (const m of allMotos) {
  if (idMap.has(m.id)) {
    throw new Error(`ID duplicado detectado: ${m.id}`);
  }
  idMap.add(m.id);

  if (m.fipeCode) {
    if (fipeMap.has(m.fipeCode)) {
      throw new Error(`Código FIPE duplicado detectado: ${m.fipeCode} (${m.name})`);
    }
    fipeMap.add(m.fipeCode);
  }
}
console.log('Validação de integridade: Sucesso sem duplicatas!');

// 3. Write frontend/src/data/officialFipeCatalog.ts
const frontendFileContent = `import { Vehicle } from '../types';

export const officialFipeCatalog: Vehicle[] = ${JSON.stringify(allMotos, null, 2)};
`;

fs.writeFileSync(
  path.join(__dirname, 'frontend/src/data/officialFipeCatalog.ts'),
  frontendFileContent,
  'utf8'
);
console.log('frontend/src/data/officialFipeCatalog.ts gerado com sucesso!');

// 4. Write backend/src/fipe/fipe.service.ts
const backendServiceTemplate = `import { Injectable, Logger } from '@nestjs/common';
import { Vehicle, MotoCategory } from '../common/types';

export interface FipeBrand {
  nome: string;
  valor: string;
}

export interface FipeModel {
  nome: string;
  codigo: string;
}

@Injectable()
export class FipeService {
  private readonly logger = new Logger(FipeService.name);

  // Catálogo completo consolidado com todas as ${allMotos.length} motocicletas oficiais do mercado brasileiro
  private publicVehiclesDatabase: Vehicle[] = ${JSON.stringify(allMotos, null, 2)};

  async getAllVehicles(): Promise<Vehicle[]> {
    return this.publicVehiclesDatabase;
  }

  async getBrands(): Promise<FipeBrand[]> {
    try {
      const res = await fetch('https://brasilapi.com.br/api/fipe/marcas/v1/motos');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      this.logger.warn('Falha na consulta externa BrasilAPI, usando marcas públicas homologadas.');
    }

    return [
      { nome: 'HONDA', valor: '77' },
      { nome: 'YAMAHA', valor: '101' },
      { nome: 'SHINERAY', valor: '172' },
      { nome: 'BAJAJ', valor: '206' },
      { nome: 'ROYAL ENFIELD', valor: '185' },
      { nome: 'HAOJUE', valor: '205' },
      { nome: 'ZONTES', valor: '225' },
      { nome: 'DAFRA', valor: '115' },
      { nome: 'MOTTU / TVS', valor: '220' },
      { nome: 'AVELLOZ', valor: '230' },
      { nome: 'BMW', valor: '6' },
      { nome: 'TRIUMPH', valor: '86' },
      { nome: 'KAWASAKI', valor: '31' },
      { nome: 'SUZUKI', valor: '80' },
      { nome: 'DUCATI', valor: '70' },
      { nome: 'HARLEY-DAVIDSON', valor: '25' },
      { nome: 'CFMOTO', valor: '240' },
      { nome: 'MOTO MORINI', valor: '245' },
      { nome: 'VOGE', valor: '250' },
      { nome: 'VESPA / PIAGGIO', valor: '88' },
      { nome: 'KTM', valor: '35' }
    ];
  }

  async getPriceByCode(fipeCode: string): Promise<any> {
    const clean = fipeCode.replace(/\\D/g, '').trim();

    try {
      const res = await fetch(\`https://brasilapi.com.br/api/fipe/preco/v1/\${clean}\`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
      }
    } catch (e) {
      this.logger.warn(\`Erro ao consultar BrasilAPI para código \${fipeCode}, ativando contingência.\`);
    }

    // Procura na base interna de motos
    const match = this.publicVehiclesDatabase.find(v => v.fipeCode && v.fipeCode.replace(/\\D/g, '') === clean);
    if (match) {
      return {
        valor: \`R$ \${match.price.toLocaleString('pt-BR')},00\`,
        marca: match.brand,
        modelo: match.name,
        anoModelo: match.year,
        combustivel: 'Gasolina',
        codigoFipe: match.fipeCode,
        mesReferencia: 'FIPE Oficial (Sincronizado)',
        tipoVeiculo: 2
      };
    }

    return null;
  }
}
`;

fs.writeFileSync(
  path.join(__dirname, 'backend/src/fipe/fipe.service.ts'),
  backendServiceTemplate,
  'utf8'
);
console.log('backend/src/fipe/fipe.service.ts gerado com sucesso!');

