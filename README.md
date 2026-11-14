# QualMoto? SAD &bull; Sistema de Apoio à Decisão para Escolha de Motocicletas

Sistema de Apoio à Decisão (SAD) multicritério para seleção e aquisição de motocicletas no mercado brasileiro, estruturado em arquitetura modular **Front-End (React + Vite)** e **Back-End (NestJS)**.

O sistema integra dados públicos oficiais (**Tabela FIPE** e matriz de eficiência energética do **Inmetro PBEV**) e elimina o ranqueamento individual simplista por meio de um algoritmo de **Clusterização Estratégica em Grupos Batizados**.

---

## 🏗️ Arquitetura do Projeto

```
SAD/
├── backend/                   # Back-End em NestJS (API REST)
│   ├── src/
│   │   ├── common/            # Tipos e interfaces de domínio
│   │   ├── decision/          # Motores TCO, TOPSIS e ClusteringService
│   │   ├── fipe/              # Integração com APIs Públicas (BrasilAPI / FIPE)
│   │   ├── app.module.ts      # Módulo raiz
│   │   └── main.ts            # Bootstrap HTTP (Porta 3001 com CORS)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                  # Front-End em React 19 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/        # Dashboard, Simulação, Relatório, Base de Veículos
│   │   ├── services/          # Cliente de API REST com Fallback Resiliente
│   │   ├── engine/            # Motores analíticos client-side
│   │   ├── types/             # Tipagem estrita TypeScript
│   │   └── App.tsx            # Ponto de entrada SPA
│   ├── package.json
│   └── vite.config.ts
│
├── package.json               # Gerenciador raiz de scripts unificados
└── README.md                  # Documentação executiva
```

---

## 🚀 Como Executar o Projeto

Você pode iniciar o Back-End e o Front-End de forma rápida a partir da raiz ou entrando em cada pasta:

### 1. Iniciar o Back-End NestJS (Porta 3001):
```bash
# Na raiz:
npm run start:backend

# Ou diretamente na pasta backend:
cd backend
npm run start:dev
```
*API disponível em:* `http://localhost:3001`  
*Endpoint de Decisão:* `POST http://localhost:3001/api/decision/simulate`  
*Endpoint de Veículos FIPE:* `GET http://localhost:3001/api/decision/vehicles`

### 2. Iniciar o Front-End React / Vite (Porta 5173):
```bash
# Na raiz:
npm run start:frontend

# Ou diretamente na pasta frontend:
cd frontend
npm run dev
```
*Interface acessível em:* `http://localhost:5173`

---

## 🎯 Grupos Estratégicos de Decisão Batizados

Em vez de eleger isoladamente uma moto vencedora (1º lugar, 2º lugar), o SAD agrupa as alternativas em **5 Arquétipos Estratégicos com Justificativa de Perfil**:

1. ⚡ **Econômicas & Baixo Custo:** Ultra-econômicas com menor custo por km (abaixo de R$ 0,55/km), consumo acima de 43 km/l e manutenção acessível (ex: Pop 110i, Factor 125, Biz 125, Chopper Road 150).
2. 🛡️ **Robustez Operacional & Terreno Severo:** Categoria Trail com suspensão de curso longo (180mm a 220mm) para asfalto castigado, valetas e vias periféricas (ex: Bros 160, Crosser 150, Lander 250, Sahara 300).
3. 💎 **Proteção Patrimonial & Revenda Imediata:** Líderes históricas com menor depreciação FIPE (abaixo de 5,5% ao ano) e liquidez em dinheiro no mesmo dia (ex: Linha Honda CG 160 Titan/Fan, Fazer 150).
4. 🛋️ **Conforto & Praticidade Diária:** Scooters automáticas com transmissão CVT, assoalho plano e baú sob o banco para transporte protegido (ex: PCX 160, NMAX 160).
5. 🚀 **Performance & Conectividade Urbana:** Motos de 250cc a 400cc com freio ABS duplo e potência para retomadas seguras em rodovias e vias expressas (ex: CB 300F Twister, FZ25, Dominar 400).

---

## 📊 Métodos e Funções Analíticas Utilizadas (SAD)

* **Classificação (TOPSIS):** Normalização vetorial euclidiana com vetor de pesos dinâmico, determinação de pontos ideais positivos ($A^+$) e negativos ($A^-$) e coeficiente de proximidade relativa ($C_i$).
* **Agrupamento (Clusterização Estratégica):** Agrupamento semântico em 5 clusters batizados e cálculo do grau de aderência (*FitScore* de $0$ a $100\%$) entre os grupos e o perfil orçamentário.
* **Regressão Temporal (Ciclo de Vida Manter vs. Trocar):** Regressão exponencial de valor residual FIPE e modelagem do desgaste mecânico para identificar o Ponto de Inflexão (ótimo de substituição aos 36 meses).
* **Sumarização (Laudo Técnico Decisório):** Consolidação dos 201 modelos em KPIs executivos, parecer justificado e emissão de laudo em PDF.
* **TCO (Total Cost of Ownership):** Custo de propriedade mensal completo considerando consumo Inmetro, manutenção por km, custos fixos e desvalorização.
