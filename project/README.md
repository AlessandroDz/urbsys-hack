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

## Como Rodar Localmente

> **Atenção:** Por utilizar React, TypeScript, Vite e Three.js, este projeto **não deve ser aberto diretamente via extensão Live Server**. Utilize o servidor de desenvolvimento do Vite seguindo os passos abaixo:

1. **Certifique-se de estar na pasta `project/`:**
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

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR). |
| `npm run build` | Gera a versão otimizada para produção na pasta `dist/`. |
| `npm run preview` | Inicia um servidor local para visualizar a build de produção. |
| `npm run typecheck` | Executa a verificação de tipos do TypeScript sem emitir arquivos. |
| `npm run lint` | Analisa o código com ESLint em busca de problemas de padronização. |

