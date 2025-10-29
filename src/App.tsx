
import React, { useState, useEffect, useCallback } from 'react';
import {ChevronRight, Rocket, CheckCircle, AlertCircle} from 'lucide-react';

// Tipos TypeScript
interface TrialData {
  participantId: string;
  trialIndex: number;
  word: string;
  color: string;
  congruent: boolean;
  response: boolean | null;
  reactionTime: number;
  accuracy: boolean;
  timestamp: string;
}

interface StroopTrial {
  word: string;
  color: string;
  congruent: boolean;
}

// Configurações do experimento
const WORDS = ['VERMELHO', 'VERDE', 'AZUL'];
const COLORS = ['red', 'green', 'blue'];
const COLOR_NAMES = {
  red: 'VERMELHO',
  green: 'VERDE',
  blue: 'AZUL'
};
const TOTAL_TRIALS = 80;
const PRACTICE_TRIALS = 5;

// URL do Google Apps Script - SUBSTITUA PELA SUA URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxejAMFb9CCxFTzR7udNidRcHHyZVgbrdX9LwpN9P3dCncGhVvFmnGof6wq4NW8tDCzWw/exec";

const App: React.FC = () => {
  // Estados do experimento
  const [phase, setPhase] = useState<'welcome' | 'code' | 'consent' | 'instructions' | 'practice' | 'experiment' | 'finish'>('welcome');
  const [participantId, setParticipantId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<StroopTrial[]>([]);
  const [practiceTrials, setPracticeTrials] = useState<StroopTrial[]>([]);
  const [experimentData, setExperimentData] = useState<TrialData[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [isPractice, setIsPractice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Gerar código do participante
  const generateParticipantCode = (first: string, last: string): string => {
    const initials = (first.charAt(0) + last.charAt(0)).toUpperCase();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `${initials}-${randomNum}`;
  };

  // Gerar trials Stroop
  const generateTrials = useCallback((numTrials: number): StroopTrial[] => {
    const trials: StroopTrial[] = [];
    const congruentCount = Math.floor(numTrials / 2);
    const incongruentCount = numTrials - congruentCount;

    // Trials congruentes
    for (let i = 0; i < congruentCount; i++) {
      const colorIndex = Math.floor(Math.random() * COLORS.length);
      trials.push({
        word: WORDS[colorIndex],
        color: COLORS[colorIndex],
        congruent: true
      });
    }

    // Trials incongruentes
    for (let i = 0; i < incongruentCount; i++) {
      const wordIndex = Math.floor(Math.random() * WORDS.length);
      let colorIndex;
      do {
        colorIndex = Math.floor(Math.random() * COLORS.length);
      } while (colorIndex === wordIndex);

      trials.push({
        word: WORDS[wordIndex],
        color: COLORS[colorIndex],
        congruent: false
      });
    }

    // Embaralhar
    return trials.sort(() => Math.random() - 0.5);
  }, []);

  // Inicializar trials quando necessário
  useEffect(() => {
    if (phase === 'practice' && practiceTrials.length === 0) {
      setPracticeTrials(generateTrials(PRACTICE_TRIALS));
    }
    if (phase === 'experiment' && trials.length === 0) {
      setTrials(generateTrials(TOTAL_TRIALS));
    }
  }, [phase, generateTrials, practiceTrials.length, trials.length]);

  // Enviar dados para Google Sheets
  const sendDataToGoogleSheets = async (data: TrialData[]) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      console.log('Enviando dados para Google Sheets...', data.length, 'trials');
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Importante para Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: participantId,
          data: data,
          timestamp: new Date().toISOString(),
          totalTrials: data.length
        })
      });

      console.log('Dados enviados com sucesso!');
      setSubmitStatus('success');
      return true;
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      setSubmitStatus('error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manipular resposta do trial
  const handleTrialResponse = (response: boolean) => {
    const reactionTime = Date.now() - startTime;
    const currentTrialData = isPractice ? practiceTrials[currentTrial] : trials[currentTrial];
    const accuracy = response === currentTrialData.congruent;

    if (!isPractice) {
      const trialData: TrialData = {
        participantId,
        trialIndex: currentTrial + 1,
        word: currentTrialData.word,
        color: currentTrialData.color,
        congruent: currentTrialData.congruent,
        response,
        reactionTime,
        accuracy,
        timestamp: new Date().toISOString()
      };

      setExperimentData(prev => [...prev, trialData]);
    }

    // Próximo trial
    const maxTrials = isPractice ? PRACTICE_TRIALS : TOTAL_TRIALS;
    if (currentTrial + 1 < maxTrials) {
      setCurrentTrial(prev => prev + 1);
      setStartTime(Date.now());
    } else {
      if (isPractice) {
        setPhase('experiment');
        setIsPractice(false);
        setCurrentTrial(0);
      } else {
        setPhase('finish');
      }
    }
  };

  // Enviar dados quando terminar o experimento
  useEffect(() => {
    if (phase === 'finish' && experimentData.length > 0) {
      sendDataToGoogleSheets(experimentData);
    }
  }, [phase, experimentData]);

  // Manipuladores de teclado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (phase === 'practice' || phase === 'experiment') {
        if (event.key === 'ArrowLeft') {
          handleTrialResponse(false); // Incongruente
        } else if (event.key === 'ArrowRight') {
          handleTrialResponse(true); // Congruente
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, currentTrial, startTime, isPractice]);

  // Iniciar tempo quando mostrar estímulo
  useEffect(() => {
    if (phase === 'practice' || phase === 'experiment') {
      setStartTime(Date.now());
    }
  }, [phase, currentTrial]);

  // Componente de barra de progresso
  const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const percentage = (current / total) * 100;
    return (
      <div className="progress-container">
        <div className="progress-bar relative">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
          <div className="rocket" style={{ left: `${Math.min(percentage, 100)}%` }}>
            <Rocket size={24} />
          </div>
        </div>
        <div className="progress-text">
          {current}/{total} tentativas
        </div>
      </div>
    );
  };

  // Renderização das fases
  const renderPhase = () => {
    switch (phase) {
      case 'welcome':
        return (
          <div className="card">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-800">
              Bem-vindo(a) ao Estudo sobre Atenção e Controle Cognitivo
            </h1>
            <h2 className="text-xl md:text-2xl text-center mb-6 text-blue-600 font-semibold">
              LAPS/UFPA
            </h2>
            
            <div className="mb-6 space-y-2 text-center">
              <p><strong>Projeto:</strong> "Geometria da interferência contextual em tarefa tipo Stroop: um único parâmetro θ resume a dinâmica"</p>
              <p><strong>Pesquisadores:</strong> Dr. Antônio Pereira Jr. e José Antônio Amador</p>
            </div>

            <div className="highlight-box">
              <p className="text-center font-medium">
                Esta pesquisa é <strong>completamente anônima</strong>. Para gerar seu código de identificação, preencha os campos abaixo:
              </p>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">Primeiro nome:</label>
                <input
                  type="text"
                  id="firstName"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Digite seu primeiro nome"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Último sobrenome:</label>
                <input
                  type="text"
                  id="lastName"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Digite seu último sobrenome"
                  required
                />
              </div>

              <button
                className="button-primary w-full mt-6"
                onClick={() => {
                  if (firstName.trim() && lastName.trim()) {
                    const code = generateParticipantCode(firstName, lastName);
                    setParticipantId(code);
                    setPhase('code');
                  }
                }}
                disabled={!firstName.trim() || !lastName.trim()}
              >
                Gerar meu código anônimo <ChevronRight className="ml-2" size={20} />
              </button>
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="card">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-800">
              Seu código de participante foi gerado!
            </h2>
            
            <div className="participant-code">
              <p className="text-lg font-medium mb-2">
                <strong>Anote este código:</strong>
              </p>
              <div className="code-display">
                {participantId}
              </div>
              <p className="text-sm text-slate-600 mt-2">
                <em>Este código é necessário caso deseje solicitar a exclusão dos seus dados.</em>
              </p>
            </div>

            <button
              className="button-primary w-full"
              onClick={() => setPhase('consent')}
            >
              Prosseguir para o termo de consentimento <ChevronRight className="ml-2" size={20} />
            </button>
          </div>
        );

      case 'consent':
        return (
          <div className="card">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-800">
              Termo de Consentimento Livre e Esclarecido (TCLE)
            </h2>
            
            <div className="tcle-container">
              <h3 className="font-bold text-lg mb-3">INFORMAÇÕES SOBRE A PESQUISA</h3>
              <p><strong>Título:</strong> Geometria da interferência contextual em tarefa tipo Stroop: um único parâmetro θ resume a dinâmica</p>
              <p><strong>Pesquisadores responsáveis:</strong> Dr. Antônio Pereira Jr. e José Antônio Amador</p>
              <p><strong>Instituição:</strong> Laboratório de Processamento de Sinais (LAPS), Instituto de Tecnologia (ITEC), Universidade Federal do Pará (UFPA)</p>
              
              <h3 className="font-bold text-lg mb-2 mt-4">OBJETIVO DA PESQUISA</h3>
              <p>O estudo tem como objetivo investigar como a atenção e o controle cognitivo se adaptam ao longo do tempo em uma tarefa tipo Stroop, avaliando se um parâmetro geométrico simples (chamado θ) pode representar de forma confiável essa adaptação.</p>
              
              <h3 className="font-bold text-lg mb-2 mt-4">PROCEDIMENTOS</h3>
              <p>Você participará de uma tarefa computadorizada onde verá palavras coloridas na tela e deverá indicar se a cor da tinta corresponde ao significado da palavra. A tarefa durará aproximadamente 10 minutos.</p>
              
              <h3 className="font-bold text-lg mb-2 mt-4">RISCOS E BENEFÍCIOS</h3>
              <p>Os riscos são mínimos, podendo incluir leve fadiga visual ou mental devido à concentração necessária durante a tarefa. Não há benefícios diretos, mas sua participação contribui para o avanço do conhecimento científico em neurociência cognitiva.</p>
              
              <h3 className="font-bold text-lg mb-2 mt-4">CONFIDENCIALIDADE</h3>
              <p>Seus dados são completamente anônimos. Apenas um código pseudonimizado será usado para identificar suas respostas. Nenhuma informação pessoal será coletada ou armazenada. Todos os dados serão tratados de forma sigilosa e anônima, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
              
              <h3 className="font-bold text-lg mb-2 mt-4">PARTICIPAÇÃO VOLUNTÁRIA</h3>
              <p>Sua participação é voluntária. Você pode desistir a qualquer momento sem prejuízo algum. Para solicitar a exclusão de seus dados, entre em contato informando seu código de participante fornecido.</p>
              
              <h3 className="font-bold text-lg mb-2 mt-4">CONTATO</h3>
              <p>Para dúvidas ou solicitações, entre em contato com os pesquisadores responsáveis:</p>
              <p>E-mail: <strong>apereira@ufpa.br</strong> ou <strong>jose.amador@ntpc.ufpa.br</strong></p>
              <p>Telefone: (91) 3201-7426</p>
            </div>

            <div className="mt-6">
              <p className="text-center font-medium mb-4">
                <strong>Ao clicar em "Tenho 18 anos ou mais e li e aceito participar", você confirma que:</strong>
              </p>
              <ul className="instructions-list text-sm">
                <li>Leu e compreendeu as informações sobre a pesquisa</li>
                <li>Tem 18 anos de idade ou mais</li>
                <li>Teve oportunidade de fazer perguntas</li>
                <li>Concorda voluntariamente em participar</li>
                <li>Entende que pode desistir a qualquer momento</li>
              </ul>
            </div>

            <button
              className="button-primary w-full mt-6"
              onClick={() => setPhase('instructions')}
            >
              <CheckCircle className="mr-2" size={20} />
              Tenho 18 anos ou mais e li e aceito participar da pesquisa
            </button>
          </div>
        );

      case 'instructions':
        return (
          <div className="card">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-800">
              Instruções da Tarefa
            </h2>

            <div className="space-y-6">
              <p className="text-lg text-center">
                Você verá palavras coloridas na tela. Sua tarefa é indicar se:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
                  <h3 className="font-bold text-green-800">CONGRUENTE</h3>
                  <p className="text-sm">A cor da tinta e o significado da palavra são iguais</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="mx-auto mb-2 text-red-600" size={32} />
                  <h3 className="font-bold text-red-800">INCONGRUENTE</h3>
                  <p className="text-sm">A cor da tinta e o significado da palavra são diferentes</p>
                </div>
              </div>

              <div className="highlight-box">
                <h3 className="font-bold mb-2">Como responder:</h3>
                <ul className="instructions-list">
                  <li>Use as <strong>setas do teclado</strong> (← para incongruente, → para congruente)</li>
                  <li>Ou toque nos <strong>botões na tela</strong></li>
                  <li>Responda o mais <strong>rápido e precisamente</strong> possível</li>
                </ul>
              </div>

              <p className="text-center">
                Primeiro faremos uma breve rodada de prática para você se familiarizar com a tarefa.
              </p>
            </div>

            <button
              className="button-primary w-full mt-6"
              onClick={() => {
                setPhase('practice');
                setIsPractice(true);
                setCurrentTrial(0);
              }}
            >
              Iniciar prática <ChevronRight className="ml-2" size={20} />
            </button>
          </div>
        );

      case 'practice':
        const practiceTrialData = practiceTrials[currentTrial];
        if (!practiceTrialData) return <div>Carregando...</div>;

        return (
          <div className="card">
            <h3 className="text-xl font-bold text-center mb-4">
              Prática ({currentTrial + 1}/{PRACTICE_TRIALS})
            </h3>

            <div className={`stroop-word color-${practiceTrialData.color}`}>
              {practiceTrialData.word}
            </div>

            <p className="text-center text-lg mb-6">
              A cor da tinta e o significado da palavra são iguais ou diferentes?
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="button-stroop button-incongruent"
                onClick={() => handleTrialResponse(false)}
              >
                ❌ Incongruente
              </button>
              <button
                className="button-stroop button-congruent"
                onClick={() => handleTrialResponse(true)}
              >
                ✅ Congruente
              </button>
            </div>

            <p className="text-center text-sm text-slate-600 mt-4">
              Use as setas do teclado: ← Incongruente | → Congruente
            </p>
          </div>
        );

      case 'experiment':
        const trialData = trials[currentTrial];
        if (!trialData) return <div>Carregando...</div>;

        return (
          <div className="card">
            <ProgressBar current={currentTrial + 1} total={TOTAL_TRIALS} />
            
            <h3 className="text-xl font-bold text-center mb-4">
              Tentativa {currentTrial + 1}/{TOTAL_TRIALS}
            </h3>

            <div className={`stroop-word color-${trialData.color}`}>
              {trialData.word}
            </div>

            <p className="text-center text-lg mb-6">
              A cor da tinta e o significado da palavra são iguais ou diferentes?
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="button-stroop button-incongruent"
                onClick={() => handleTrialResponse(false)}
              >
                ❌ Incongruente
              </button>
              <button
                className="button-stroop button-congruent"
                onClick={() => handleTrialResponse(true)}
              >
                ✅ Congruente
              </button>
            </div>

            <p className="text-center text-sm text-slate-600 mt-4">
              Use as setas do teclado: ← Incongruente | → Congruente
            </p>
          </div>
        );

      case 'finish':
        return (
          <div className="card">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">
                Fim da Tarefa
              </h2>
              
              {isSubmitting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-lg font-medium text-blue-800">
                    Enviando dados...
                  </p>
                </div>
              )}

              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
                  <p className="text-lg font-medium text-green-800 mb-2">
                    ✅ Dados enviados com sucesso!
                  </p>
                  <p className="text-green-700">
                    Seus resultados foram registrados na planilha.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <AlertCircle className="mx-auto mb-2 text-red-600" size={32} />
                  <p className="text-lg font-medium text-red-800 mb-2">
                    ⚠️ Erro no envio dos dados
                  </p>
                  <p className="text-red-700">
                    Verifique sua conexão ou entre em contato com os pesquisadores.
                  </p>
                </div>
              )}

              <p className="mb-4">
                Sua participação é muito importante para o avanço da pesquisa em neurociência cognitiva.
              </p>

              <div className="participant-code">
                <p className="font-medium">
                  <strong>Código do participante:</strong>
                </p>
                <div className="code-display text-xl">
                  {participantId}
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  <em>Guarde este código caso precise solicitar a exclusão dos seus dados.</em>
                </p>
              </div>

              <button
                className="button-primary mt-6"
                onClick={() => window.location.reload()}
              >
                Encerrar
              </button>
            </div>
          </div>
        );

      default:
        return <div>Carregando...</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="experiment-container">
        {renderPhase()}
      </div>
      
      <footer className="footer">
        <p>Pesquisa aprovada pelo Comitê de Ética em Pesquisa da UFPA sob parecer nº xxxxxx.</p>
        <p>Laboratório de Processamento de Sinais (LAPS) – Instituto de Tecnologia (ITEC) – UFPA, 2025.</p>
      </footer>
    </div>
  );
};

export default App;




