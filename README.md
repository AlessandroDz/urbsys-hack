# UrbisAI — Simulador de Impacto Urbano (GovTech)

Aplicação web interativa em 3D para simulação e análise de impactos socioeconômicos, viários e ambientais causados por obras e intervenções urbanas.

---

## Sobre o Projeto

O **UrbisAI** permite visualizar em tempo real uma malha urbana isométrica 3D com fluxo de veículos e ônibus, posicionar diferentes tipos de obras no cruzamento central e gerar um diagnóstico completo dividido em três pilares:

1. **Impacto Imediato (O Choque)**: Estimativa de comércios afetados, queda percentual de faturamento, perdas financeiras (mensal e acumulada), linhas de ônibus desviadas, acréscimo no tempo de viagem e quilômetros de ciclovias impactadas.
2. **Plano de Mitigação Recomendado pela IA**: Ações práticas para o trânsito (onda verde, corredores exclusivos, painéis de mensagem variável, janelas noturnas) e medidas econômicas compensatórias (isenção parcial de IPTU, crédito subsidiado, vale-consumo).
3. **Legado Pós-Obra (ROI Social e Econômico)**: Ganhos permanentes após a conclusão da obra, incluindo redução no tempo de travessia, valorização imobiliária do entorno e redução anual na emissão de $CO_2$.

---

## Intervenções Disponíveis

- **Construção de Mergulhão** (`underpass`): Trincheira subterrânea para o tráfego da avenida principal.
- **Novo Viaduto** (`viaduct`): Estrutura elevada que libera o cruzamento central do semáforo.
- **Recapeamento de Via** (`resurfacing`): Renovação da camada asfáltica com nova sinalização horizontal.
- **Implantação de Ciclovia** (`bikeLane`): Faixa segregada para bicicletas ao longo da avenida.

Cada intervenção permite configurar:
- **Duração estimada**: de 1 a 24 meses.
- **Nível de bloqueio**: Parcial (uma faixa bloqueada) ou Total (interdição completa nos dois sentidos).
- **Motivo / Escopo da obra**: Descrição personalizada da intervenção.

---

## Tecnologias Utilizadas

- **[React 18](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite](https://vitejs.dev/)** (Bundler e servidor de desenvolvimento)
- **[Three.js](https://threejs.org/)**, **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)** e **[@react-three/drei](https://github.com/pmndrs/drei)** (Renderização e controles 3D)
- **[Tailwind CSS](https://tailwindcss.com/)** (Estilização e interface glassmorphism)
- **[Lucide React](https://lucide.dev/)** (Ícones)

---

## Estrutura de Pastas

```text
UrbSystem/
└── project/
    ├── index.html                  # Documento HTML raiz
    ├── package.json                # Dependências e scripts NPM
    ├── vite.config.ts              # Configuração do Vite e alias '@'
    ├── tailwind.config.js          # Configuração do Tailwind CSS
    └── src/
        ├── App.tsx                 # Componente principal e layout da aplicação
        ├── main.tsx                # Ponto de entrada React
        ├── index.css               # Estilos globais e diretivas Tailwind
        ├── components/
        │   ├── scene/              # Cena 3D (Three.js / React Three Fiber)
        │   │   ├── CityScene.tsx   # Canvas 3D, iluminação e câmera ortográfica
        │   │   ├── CityBlocks.tsx  # Geração procedural dos quarteirões e parques
        │   │   ├── Roads.tsx       # Avenidas, ruas e sinalização horizontal
        │   │   ├── Traffic.tsx     # Simulação contínua de carros e ônibus
        │   │   ├── WorkSite.tsx    # Canteiros de obras 3D (guindaste, tratores, rolos)
        │   │   └── cityLayout.ts   # Constantes geométricas e gerador pseudoaleatório
        │   └── ui/                 # Interface do usuário (HUD e painéis)
        │       ├── Header.tsx              # Indicador de status do trânsito em tempo real
        │       ├── InterventionsPanel.tsx  # Painel lateral com suporte a clique e drag-and-drop
        │       ├── ParametersCard.tsx      # Configuração de duração, bloqueio e escopo
        │       ├── primitives.tsx          # Componentes visuais reutilizáveis (cards, métricas, barras)
        │       └── diagnosis/
        │           ├── DiagnosisDrawer.tsx   # Gaveta lateral com estados de carregamento e resultado
        │           └── DiagnosisSections.tsx # Blocos de Choque, Mitigação e Legado
        ├── hooks/
        │   └── useUrbanSimulation.ts # Gerenciamento de estado da simulação
        └── lib/
            ├── interventions.ts    # Catálogo e perfil de impacto das obras
            ├── diagnosis.ts        # Motor de cálculo socioeconômico e recomendações
            └── format.ts           # Formatadores numéricos e monetários (pt-BR / BRL)
```

---

## Pré-requisitos

- **[Node.js](https://nodejs.org/)** (versão 18 ou superior recomendada)
- **npm** (incluído com o Node.js)

---

## Como Rodar Localmente

> **Atenção:** Por utilizar React, TypeScript, Vite e Three.js, este projeto **não deve ser aberto diretamente via extensão Live Server**. Utilize o servidor de desenvolvimento do Vite seguindo os passos abaixo:

1. **Acesse a pasta do projeto:**
   ```bash
   cd project
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra o endereço exibido no terminal (geralmente `http://localhost:5173`).

---

## Scripts Disponíveis

Dentro da pasta `project/`, você pode executar:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR). |
| `npm run build` | Gera a versão otimizada para produção na pasta `dist/`. |
| `npm run preview` | Inicia um servidor local para visualizar a build de produção. |
| `npm run typecheck` | Executa a verificação de tipos do TypeScript sem emitir arquivos. |
| `npm run lint` | Analisa o código com ESLint em busca de problemas de padronização. |

# Pitch de Apresentação

Você já ficou preso no trânsito por causa de uma obra mal planejada? Ou pior, já viu o comércio do seu bairro falir porque a rua ficou interditada por meses? 🚧📉
Neste fim de semana, minha equipe e eu encaramos o desafio do HackFAESA para resolver a cegueira do planejamento urbano. Foi assim que desenvolvemos e 
apresentamos o UrbisAI. 🚀

Hoje, prefeituras dependem de Estudos de Impacto de Vizinhança que custam fortunas e demoram até 2 anos para ficarem prontos. O problema? Esses documentos de 500 páginas contam os carros no semáforo, algo que pode passar despercebido ao gestor é quais CNPJs vão quebrar durante o processo.

Com o UrbisAI, nós transformamos esse cenário. Criamos o protótipo de uma plataforma GovTech de inteligência preditiva. Através de uma interface 3D interativa — no melhor estilo SimCity —, o gestor arrasta a intervenção (como um viaduto ou recapeamento) diretamente para o mapa da cidade.

Em minutos, nossa IA cruza dados georreferenciados e socioeconomicos e gera um relatório executivo mostrando: 🏢 O risco financeiro e os comércios isolados na zona da obra. 🚌 O impacto nas linhas de ônibus e na mobilidade ativa. ✅ Um Plano de Mitigação automático (ex: criar faixa exclusiva provisória e sugerir isenção temporária de IPTU para os lojistas afetados).

Entregamos a comparação das partes: saímos de um PDF estático de milhares de reais para previsibilidade socioeconômica instantânea para cidades como a nossa Grande Vitória.

Importante lembrar que essa solução não substitui o relatório detalhado que já é feito, mas traz para o secretário de mobilidade urbana ou o prefeito, em uma única assinatura, de forma simples, direta e em poucos minutos, qual o impacto que uma paralização traria para as pessoas e comerciantes de certo lugar. Sem precisar da burocracia de uma licitação ou gastar rios de dinheiro público para fazer um estudo e descobrir que não é viável naquele momento ou financeiramente 

Construir essa arquitetura e validar esse modelo de negócios B2G em um fim de semana foi intenso, mas provou que o futuro das smart cities não é apenas instalar sensores em semáforos. É ter empatia com quem vive e empreende no local.
Um agradecimento gigante ao time que virou a noite fazendo isso acontecer:

