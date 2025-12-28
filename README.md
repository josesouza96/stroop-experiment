# 🧠 Experimento Stroop - LAPS/UFPA

## Geometria da interferência contextual em tarefa tipo Stroop: um único parâmetro θ resume a dinâmica

[![Deploy](https://github.com/josesouza96/stroop-experiment/actions/workflows/static.yml/badge.svg)](https://github.com/josesouza96/stroop-experiment/actions/workflows/static.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### 📋 Sobre o Projeto

Este é um experimento online desenvolvido para investigar como a atenção se adapta durante uma tarefa tipo Stroop, medindo tempos de reação e precisão das respostas. O projeto foi desenvolvido pelo **Laboratório de Processamento de Sinais (LAPS)** do **Instituto de Tecnologia (ITEC)** da **Universidade Federal do Pará (UFPA)**.

**Pesquisadores Responsáveis:**
- Dr. Antônio Pereira Jr.
- José Antônio Amador

### 🎯 Objetivos

- Investigar a interferência contextual em tarefas tipo Stroop
- Medir tempos de reação e precisão em condições congruentes e incongruentes
- Coletar dados para análise da geometria da interferência cognitiva
- Contribuir para o avanço do conhecimento em neurociência cognitiva

### 🔬 Metodologia

O experimento consiste em uma tarefa computadorizada onde os participantes:

1. **Visualizam palavras coloridas** na tela (VERMELHO, VERDE, AZUL)
2. **Identificam se há congruência** entre a cor da tinta e o significado da palavra
3. **Respondem via teclado** (setas) ou cliques nos botões
4. **Completam 80 tentativas** após uma fase de prática com 5 tentativas

### 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 + Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: GitHub Pages
- **Data Collection**: Google Apps Script + Google Sheets

### 📊 Coleta de Dados

- **Anonimato garantido**: Uso de códigos pseudônimos gerados automaticamente
- **Dados coletados**: Tempos de reação, precisão, tipo de trial (congruente/incongruente)
- **Armazenamento**: Google Sheets via Google Apps Script
- **Conformidade ética**: Aprovado pelo Comitê de Ética em Pesquisa da UFPA

### 🛠️ Instalação e Execução

#### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

#### Passos para executar localmente

1. **Clone o repositório**
```bash
git clone https://github.com/josesouza96/stroop-experiment.git
cd stroop-experiment
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute em modo de desenvolvimento**
```bash
npm run dev
```

4. **Acesse no navegador**
```
http://localhost:5173
```

#### Build para produção
```bash
npm run build
```

### 🌐 Deploy

O projeto está configurado para deploy automático no GitHub Pages através do GitHub Actions.

**URL de acesso**: `https://josesouza96.github.io/stroop-experiment/`

#### Configuração do Deploy

1. **Ative o GitHub Pages** nas configurações do repositório
2. **Configure a source** como "GitHub Actions"
3. **O workflow** `.github/workflows/static.yml` fará o deploy automático

### 📁 Estrutura do Projeto

```
stroop-experiment/
├── public/
├── src/
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Entrada da aplicação
│   ├── index.css         # Estilos globais
│   └── lib/
│       └── lumi.ts       # Configuração SDK
├── .github/
│   └── workflows/
│       └── static.yml    # CI/CD GitHub Actions
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

### 🎮 Como Participar

1. **Acesse o experimento** através do link fornecido
2. **Leia o TCLE** (Termo de Consentimento Livre e Esclarecido)
3. **Gere seu código anônimo** com primeiro nome e último sobrenome
4. **Complete a fase de prática** (5 tentativas)
5. **Realize o experimento** (80 tentativas)
6. **Seus dados serão enviados automaticamente** ao final

### 🔒 Privacidade e Ética

- ✅ **Pesquisa aprovada** pelo Comitê de Ética em Pesquisa da UFPA
- ✅ **Dados completamente anônimos** - apenas códigos pseudônimos
- ✅ **Participação voluntária** - possibilidade de desistência a qualquer momento
- ✅ **TCLE disponível** para download
- ✅ **Código de participante** para eventual solicitação de exclusão de dados

### 📈 Dados Coletados

Para cada tentativa, são registrados:

- **participantId**: Código pseudônimo do participante
- **trialIndex**: Número da tentativa (1-80)
- **word**: Palavra apresentada
- **color**: Cor da tinta
- **congruent**: Se é congruente (true/false)
- **response**: Resposta do participante (true/false)
- **reactionTime**: Tempo de reação em milissegundos
- **accuracy**: Precisão da resposta
- **timestamp**: Momento da resposta

### 🤝 Contribuições

Este é um projeto de pesquisa acadêmica. Para sugestões ou melhorias:

1. Abra uma **issue** descrevendo o problema ou sugestão
2. Faça um **fork** do projeto
3. Crie uma **branch** para sua feature
4. Faça o **commit** das mudanças
5. Abra um **Pull Request**

### 📞 Contato

**Laboratório de Processamento de Sinais (LAPS)**  
Instituto de Tecnologia (ITEC)  
Universidade Federal do Pará (UFPA)

Para dúvidas sobre a pesquisa ou solicitação de exclusão de dados, entre em contato através dos canais oficiais da UFPA informando o código de participante.

### 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

### 🏆 Reconhecimentos

- **UFPA** - Universidade Federal do Pará
- **LAPS** - Laboratório de Processamento de Sinais
- **ITEC** - Instituto de Tecnologia
- **Participantes da pesquisa** - Essenciais para o avanço científico

---


*Última atualização: Novembro de 2025*
