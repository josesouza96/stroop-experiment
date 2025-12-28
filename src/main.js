
// Configuração da URL do Google Apps Script para envio de dados
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwTflRzizv3-41wffxIwlB_DeINYp3qQvqVhs7Zj5pZ6O6Y9iiNrr0irxMsnD0Z8q0W-A/exec";

// Variáveis globais do experimento
let participantId = '';
let consentAccepted = false;
let experimentData = [];
let currentTrial = 0;
const totalTrials = 80;

// Palavras e cores para o experimento Stroop
const words = ['VERMELHO', 'VERDE', 'AZUL'];
const colors = ['red', 'green', 'blue'];
const colorNames = {
    'red': 'VERMELHO',
    'green': 'VERDE', 
    'blue': 'AZUL'
};

// Inicialização do jsPsych
const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    on_finish: function() {
        sendDataToGoogleSheets();
    }
});

// Função para gerar código de participante
function generateParticipantCode(firstName, lastName) {
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `${initials}-${randomNum}`;
}

// Função para criar barra de progresso
function createProgressBar(current, total) {
    const percentage = (current / total) * 100;
    const rocketPosition = Math.min(percentage, 100);
    
    return `
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="progress-rocket" style="left: ${rocketPosition}%">🚀</div>
        </div>
    `;
}

// Função para gerar trials Stroop
function generateStroopTrials(isPractice = false) {
    const trials = [];
    const numTrials = isPractice ? 5 : totalTrials;
    const congruentCount = isPractice ? 3 : 40;
    const incongruentCount = isPractice ? 2 : 40;
    
    // Gerar trials congruentes
    for (let i = 0; i < congruentCount; i++) {
        const colorIndex = Math.floor(Math.random() * colors.length);
        trials.push({
            word: words[colorIndex],
            color: colors[colorIndex],
            congruent: true
        });
    }
    
    // Gerar trials incongruentes
    for (let i = 0; i < incongruentCount; i++) {
        const wordIndex = Math.floor(Math.random() * words.length);
        let colorIndex;
        do {
            colorIndex = Math.floor(Math.random() * colors.length);
        } while (colorIndex === wordIndex);
        
        trials.push({
            word: words[wordIndex],
            color: colors[colorIndex],
            congruent: false
        });
    }
    
    // Embaralhar trials
    return jsPsych.randomization.shuffle(trials);
}

// Função para enviar dados para Google Sheets
async function sendDataToGoogleSheets() {
    if (experimentData.length === 0) return;
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: experimentData,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error('Falha no envio');
        }
        
        console.log('Dados enviados com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        downloadCSV();
    }
}

// Função para download de CSV como backup
function downloadCSV() {
    const headers = ['participant_id', 'trial_index', 'palavra', 'cor', 'congruencia', 'rt', 'acuracia', 'timestamp'];
    const csvContent = [
        headers.join(','),
        ...experimentData.map(row => [
            row.participant_id,
            row.trial_index,
            row.palavra,
            row.cor,
            row.congruencia,
            row.rt,
            row.acuracia,
            row.timestamp
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stroop_data_${participantId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Timeline do experimento
const timeline = [];

// 1. Página inicial - Geração do código
const welcome = {
    type: jsPsychSurveyHtmlForm,
    html: `
        <h1>Bem-vindo(a) ao Estudo sobre Atenção e Controle Cognitivo</h1>
        <h2>Laboratório de Processamento de Sinais - ITEC/UFPA</h2>
        <p><strong>Pesquisa:</strong> "Geometria da interferência contextual em tarefa tipo Stroop: um único parâmetro θ resume a dinâmica"</p>
        <p><strong>Pesquisadores:</strong> Dr. Antônio Pereira Júnior (LaPS/ITEC) e José Antônio Amador (PPGNC/NTPC)</p>
        <p>Esta pesquisa é <strong>completamente anônima</strong>. Para gerar seu código de identificação, preencha os campos abaixo:</p>
        
        <div class="form-group">
            <label for="firstName">Primeiro nome:</label>
            <input type="text" id="firstName" name="firstName" required>
        </div>
        
        <div class="form-group">
            <label for="lastName">Último sobrenome:</label>
            <input type="text" id="lastName" name="lastName" required>
        </div>
    `,
    button_label: 'Gerar meu código anônimo',
    on_finish: function(data) {
        const responses = data.response;
        participantId = generateParticipantCode(responses.firstName, responses.lastName);
    }
};

// 2. Exibição do código gerado
const showCode = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return `
            <h2>Seu código de participante foi gerado!</h2>
            <div class="participant-code">
                <p><strong>Anote este código:</strong></p>
                <div class="code-value">${participantId}</div>
                <p><em>Este código é necessário caso deseje solicitar a exclusão dos seus dados.</em></p>
            </div>
            <p>Clique em "Prosseguir" para continuar para o termo de consentimento.</p>
        `;
    },
    choices: ['Prosseguir'],
    button_html: '<button class="jspsych-btn main-button">%choice%</button>'
};

// 3. TCLE (Termo de Consentimento Livre e Esclarecido)
const tcle = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Termo de Consentimento Livre e Esclarecido (TCLE)</h2>
        <div class="tcle-container">
            <h3>INFORMAÇÕES SOBRE A PESQUISA</h3>
            <p><strong>Título:</strong> Geometria da interferência contextual em tarefa tipo Stroop: um único parâmetro θ resume a dinâmica</p>
            <p><strong>Pesquisadores responsáveis:</strong> Dr. Antônio Pereira Jr. e José Antônio Amador</p>
            <p><strong>Instituição:</strong> Laboratório de Processamento de Sinais (LAPS), Instituto de Tecnologia (ITEC), Universidade Federal do Pará (UFPA)</p>
            
            <h3>OBJETIVO DA PESQUISA</h3>
            <p>Esta pesquisa tem como objetivo investigar como a atenção se adapta durante uma tarefa tipo Stroop, medindo tempos de reação e precisão das respostas.</p>
            
            <h3>PROCEDIMENTOS</h3>
            <p>Você participará de uma tarefa computadorizada onde verá palavras coloridas na tela e deverá indicar se a cor da tinta corresponde ao significado da palavra. A tarefa durará aproximadamente 10 minutos.</p>
            
            <h3>RISCOS E BENEFÍCIOS</h3>
            <p>Os riscos são mínimos, podendo incluir leve fadiga visual. Não há benefícios diretos, mas sua participação contribui para o avanço do conhecimento científico em neurociência cognitiva.</p>
            
            <h3>CONFIDENCIALIDADE</h3>
            <p>Seus dados são completamente anônimos. Apenas um código pseudonimizado será usado para identificar suas respostas. Nenhuma informação pessoal será coletada ou armazenada.</p>
            
            <h3>PARTICIPAÇÃO VOLUNTÁRIA</h3>
            <p>Sua participação é voluntária. Você pode desistir a qualquer momento sem prejuízo algum. Para solicitar a exclusão de seus dados, entre em contato informando seu código de participante.</p>
            
            <h3>CONTATO</h3>
            <p>Para dúvidas ou solicitações, entre em contato com o pesquisadores responsáveis:</p>
            <p>E-mail: <strong>apereira@ufpa.br<strong> ou <strong>jose.amador@ntpc.ufpa.br<strong></p>
            <p>Telefone: (91) 3201-7426</p>
        </div>
        <p><strong>Ao clicar em "Tenho mais de 18 anos e Li e aceito participar", você confirma que:</strong></p>
        <ul style="text-align: left; margin: 20px auto; max-width: 500px;">
            <li>Leu e compreendeu as informações sobre a pesquisa</li>
            <li>Tem mais de 18 anos de idade</li>
            <li>Teve oportunidade de fazer perguntas</li>
            <li>Concorda voluntariamente em participar</li>
            <li>Entende que pode desistir a qualquer momento</li>
        </ul>
    `,
    choices: ['Tenho mais de 18 anos e Li e aceito participar da pesquisa'],
    button_html: '<button class="jspsych-btn main-button">%choice%</button>',
    on_finish: function() {
        consentAccepted = true;
    }
};

// 4. Instruções e prática
const instructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Instruções da Tarefa</h2>
        <div class="instructions">
            <p>Você verá palavras coloridas na tela. Sua tarefa é indicar se:</p>
            <ul>
                <li><strong>✅ CONGRUENTE:</strong> A cor da tinta e o significado da palavra são iguais</li>
                <li><strong>❌ INCONGRUENTE:</strong> A cor da tinta e o significado da palavra são diferentes</li>
            </ul>
            
            <p><strong>Como responder:</strong></p>
            <ul>
                <li>Use as <strong>setas do teclado</strong> (← para incongruente, → para congruente)</li>
                <li>Ou toque nos <strong>botões na tela</strong></li>
                <li>Responda o mais <strong>rápido e precisamente</strong> possível</li>
            </ul>
            
            <p>Primeiro faremos uma breve rodada de prática para você se familiarizar com a tarefa.</p>
        </div>
    `,
    choices: ['Iniciar prática'],
    button_html: '<button class="jspsych-btn main-button">%choice%</button>'
};

// 5. Trials de prática
const practiceTrials = generateStroopTrials(true);
const practice = {
    timeline: practiceTrials.map((trial, index) => ({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            return `
                <h3>Prática (${index + 1}/5)</h3>
                <div class="stroop-stimulus" style="color: ${trial.color};">
                    ${trial.word}
                </div>
                <p>A cor da tinta e o significado da palavra são iguais ou diferentes?</p>
            `;
        },
        choices: ['❌ Incongruente', '✅ Congruente'],
        button_html: '<button class="jspsych-btn stroop-button">%choice%</button>',
        data: {
            task: 'practice',
            word: trial.word,
            color: trial.color,
            congruent: trial.congruent
        }
    }))
};

// 6. Início da tarefa principal
const startExperiment = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Fim da Prática</h2>
        <p>Agora vamos iniciar a tarefa principal.</p>
        <p>Você realizará <strong>80 tentativas</strong>. Uma pequena nave 🚀 mostrará seu progresso.</p>
        <p><strong>Lembre-se:</strong></p>
        <ul style="text-align: left; margin: 20px auto; max-width: 400px;">
            <li>Responda o mais rápido e precisamente possível</li>
            <li>Use as setas do teclado ou os botões na tela</li>
            <li>← para incongruente, → para congruente</li>
        </ul>
    `,
    choices: ['Iniciar tarefa principal'],
    button_html: '<button class="jspsych-btn main-button">%choice%</button>'
};

// 7. Tarefa principal - 80 trials
const mainTrials = generateStroopTrials(false);
const experiment = {
    timeline: mainTrials.map((trial, index) => ({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            currentTrial = index + 1;
            return `
                ${createProgressBar(currentTrial, totalTrials)}
                <h3>Tentativa ${currentTrial}/${totalTrials}</h3>
                <div class="stroop-stimulus" style="color: ${trial.color};">
                    ${trial.word}
                </div>
                <p>A cor da tinta e o significado da palavra são iguais ou diferentes?</p>
            `;
        },
        choices: ['❌ Incongruente', '✅ Congruente'],
        button_html: '<button class="jspsych-btn stroop-button">%choice%</button>',
        data: {
            task: 'main',
            word: trial.word,
            color: trial.color,
            congruent: trial.congruent,
            trial_number: index + 1
        },
        on_finish: function(data) {
            const correctAnswer = trial.congruent ? 1 : 0;
            const accuracy = data.response === correctAnswer ? 1 : 0;
            
            // Armazenar dados do trial
            experimentData.push({
                participant_id: participantId,
                trial_index: index + 1,
                palavra: trial.word,
                cor: colorNames[trial.color],
                congruencia: trial.congruent ? 'congruente' : 'incongruente',
                rt: data.rt,
                acuracia: accuracy,
                timestamp: new Date().toISOString()
            });
        }
    }))
};

// 8. Encerramento
const finish = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return `
            <h2>Fim da Tarefa</h2>
            <div style="margin: 30px 0;">
                <p style="font-size: 1.2rem; color: #2d5a27;">✅ <strong>Obrigado por participar!</strong></p>
                <p>Seus dados foram enviados com sucesso.</p>
            </div>
            <p>Sua participação é muito importante para o avanço da pesquisa em neurociência cognitiva.</p>
            <p><strong>Código do participante:</strong> ${participantId}</p>
            <p><em>Guarde este código caso precise solicitar a exclusão dos seus dados.</em></p>
        `;
    },
    choices: ['Encerrar'],
    button_html: '<button class="jspsych-btn main-button">%choice%</button>',
    on_finish: function() {
        console.log('Experimento finalizado');
    }
};

// Adicionar todos os elementos à timeline
timeline.push(welcome);
timeline.push(showCode);
timeline.push(tcle);
timeline.push(instructions);
timeline.push(practice);
timeline.push(startExperiment);
timeline.push(experiment);
timeline.push(finish);

// Executar o experimento
jsPsych.run(timeline);





