const form = document.getElementById('registroForm');
const tabela = document.querySelector('#tabela tbody');
const resumo = document.getElementById('resumo');
const graficoCanvas = document.getElementById('grafico');
const filtroPeriodo = document.getElementById('filtroPeriodo');
const btnExportar = document.getElementById('exportarCSV');
const btnImportar = document.getElementById('importarCSV');
const inputImportar = document.getElementById('inputCSV');

let registros = [];
let grafico;

// Variável para armazenar a última data selecionada
let ultimaDataSelecionada = "";

// Preenche o campo de data com a última data selecionada (se houver)
document.getElementById('data').value = ultimaDataSelecionada;

// Máscara no input de valor
const valorInputField = document.getElementById('valor');
valorInputField.addEventListener('focus', (e) => {
  e.target.value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
});

valorInputField.addEventListener('input', (e) => {
  let val = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
  if (val === '') val = '0';
  val = (parseInt(val) / 100).toFixed(2);
  e.target.value = parseFloat(val).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

valorInputField.addEventListener('blur', (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val === '') val = '0';
  val = (parseInt(val) / 100).toFixed(2);
  e.target.value = parseFloat(val).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const tipo = document.getElementById('tipo').value;
  const valorInput = document.getElementById('valor').value;
  const valor = parseFloat(valorInput.replace(/\./g, '').replace(',', '.'));
  const descricao = document.getElementById('descricao').value;

  if (!data || isNaN(valor)) return;

  // Armazena a data selecionada
  ultimaDataSelecionada = data;

  registros.push({ data, tipo, valor, descricao });
atualizarTabela();
atualizarResumo();
atualizarGrafico();

// Exibe a mensagem de sucesso
const mensagem = document.getElementById('mensagemSucesso');
mensagem.style.display = 'block';

// Oculta a mensagem após 3 segundos
setTimeout(() => {
  mensagem.style.display = 'none';
}, 3000);

// Reset e mantém a data
form.reset();
document.getElementById('data').value = ultimaDataSelecionada;  // Mantém a data
});


filtroPeriodo.addEventListener('change', () => {
  atualizarResumo();
  atualizarGrafico();
  atualizarTabela();
});

btnExportar.addEventListener('click', () => {
  if (registros.length === 0) {
    alert('Nenhum dado para exportar.');
    return;
  }

  const csvHeader = "data,tipo,valor,descricao\n";
  const csvContent = registros.map(r =>
    `${r.data},${r.tipo},${Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })},${(r.descricao || '').replace(/,/g, ' ')}`
  ).join("\n");

  const csvFinal = csvHeader + csvContent;
  const blob = new Blob([csvFinal], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', 'backup_financeiro.csv');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});


btnImportar.addEventListener('click', () => {
  inputImportar.click();
});

inputImportar.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split('\n').slice(1);
    registros = lines.filter(line => line).map(line => {
      const [data, tipo, valor, descricao] = line.split(',');
      return {
        data,
        tipo,
        valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')),
        descricao: descricao || ''
      };
    });
    atualizarTabela();
    atualizarResumo();
    atualizarGrafico();
  };
  reader.readAsText(file);
});

function atualizarTabela() {
  tabela.innerHTML = '';
  const periodo = filtroPeriodo.value;
  const dadosFiltrados = filtrarPorPeriodo(periodo);

  dadosFiltrados.forEach((r, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.data}</td>
      <td>${r.tipo}</td>
      <td>R$ ${r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${r.descricao || '-'}</td>
      <td><button onclick="removerRegistro(${index})">Remover</button></td>
    `;
    tabela.appendChild(tr);
  });
}

// Função para remover um registro específico da lista
function removerRegistro(index) {
  // Remove o registro da lista de registros
  registros.splice(index, 1);
  
  // Atualiza a tabela e o resumo
  atualizarTabela();
  atualizarResumo();
  atualizarGrafico();
}

function atualizarResumo() {
  const periodo = filtroPeriodo.value;
  const dados = filtrarPorPeriodo(periodo);

  const totalFaturamento = dados.filter(r => r.tipo === 'faturamento').reduce((s, r) => s + r.valor, 0);
  const totalInvestimentos = dados.filter(r => r.tipo === 'Investimentos').reduce((s, r) => s + r.valor, 0);
  const totalDespesadeCasa = dados.filter(r => r.tipo === 'Despesa de Casa').reduce((s, r) => s + r.valor, 0);
  const totalPagamentosdeenergia = dados.filter(r => r.tipo === 'Pagamentos de energia').reduce((s, r) => s + r.valor, 0);
  const totalPagamentodefuncionários = dados.filter(r => r.tipo === 'Pagamento de funcionários').reduce((s, r) => s + r.valor, 0);
  const lucro = totalFaturamento - totalDespesadeCasa - totalInvestimentos - totalPagamentosdeenergia - totalPagamentodefuncionários;
  const Investimento25 = totalFaturamento / 1.25;
  const lucroLiquido25 = totalFaturamento - Investimento25;


  const Investimento30 = totalFaturamento / 1.30;
  const lucroLiquido30 = totalFaturamento - Investimento30;
  
  

  resumo.innerHTML = `
    <div>
      <h3>Faturamento</h3>
      <p>R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
        <div>
      <h3>Investimentos</h3>
      <p>R$ ${totalInvestimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
        <div>
      <h3>Despesa de Casa</h3>
      <p>R$ ${totalDespesadeCasa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
        <div>
      <h3>Pagamento de Energia</h3>
      <p>R$ ${totalPagamentosdeenergia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
        <div>
      <h3>Pagamento de Funcionários</h3>
      <p>R$ ${totalPagamentodefuncionários.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
    <div>
      <h3>Lucro Bruto</h3>
      <p>R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
    <div>
      <h3>Lucro Líquido com 25%</h3>
      <p>R$ ${lucroLiquido25.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
    <div>
      <h3>Lucro Líquido com 30%</h3>
      <p>R$ ${lucroLiquido30.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
`;
    
    
}
function atualizarGrafico() {
  const periodo = filtroPeriodo.value;
  const dados = filtrarPorPeriodo(periodo);

  const datasUnicas = [...new Set(dados.map(r => r.data))].sort();
  const faturamentoPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'faturamento').reduce((s, r) => s + r.valor, 0);
  });
  const InvestimentosPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Investimentos').reduce((s, r) => s + r.valor, 0);
  });
  const DespesadeCasaPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Despesa de Casa').reduce((s, r) => s + r.valor, 0);
  });
  const PagamentosdeenergiaPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Pagamentos de energia').reduce((s, r) => s + r.valor, 0);
  });
  const PagamentodefuncionáriosPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Pagamento de funcionários').reduce((s, r) => s + r.valor, 0);
  });


  if (grafico) grafico.destroy();
  grafico = new Chart(graficoCanvas, {
    type: 'line',
    data: {
      labels: datasUnicas,
      datasets: [
        {
          label: 'Faturamento',
          data: faturamentoPorData,
          borderColor: 'limegreen',
          backgroundColor: 'rgba(50,205,50,0.2)',
          fill: true,
        },
        {
          label: 'Investimentos',
          data: InvestimentosPorData,
          borderColor: 'red',
          backgroundColor: 'rgba(255,0,0,0.2)',
          fill: true,
        },
        {
          label: 'Despesa de Casa',
          data: DespesadeCasaPorData,
          borderColor: 'blue',
          backgroundColor: 'rgba(55, 0, 255, 0.2)',
          fill: true,
        },
        {
          label: 'Pagamentos de energia',
          data: PagamentosdeenergiaPorData,
          borderColor: 'yellow',
          backgroundColor: 'rgba(255, 187, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Pagamento de funcionários',
          data: PagamentodefuncionáriosPorData,
          borderColor: '#00554a',
          backgroundColor: 'rgba(0, 255, 221, 0.2)',
          fill: true,
        },
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  atualizarGraficosAdicionais(); // <- Aqui adiciona os novos gráficos
}

function filtrarPorPeriodo() {
  const hoje = new Date();
  const periodo = filtroPeriodo.value;
  const dataInicio = new Date(document.getElementById('dataInicio').value);
  const dataFim = new Date(document.getElementById('dataFim').value);

  return registros.filter(r => {
    const dataRegistro = new Date(r.data);

    if (periodo === 'dia') {
      return dataRegistro.toDateString() === hoje.toDateString();
    }

    if (periodo === 'semana') {
      const difDias = (hoje - dataRegistro) / (1000 * 60 * 60 * 24);
      return difDias <= 7;
    }

    if (periodo === 'mes') {
      return hoje.getMonth() === dataRegistro.getMonth() &&
             hoje.getFullYear() === dataRegistro.getFullYear();
    }

    if (periodo === 'ano') {
      return hoje.getFullYear() === dataRegistro.getFullYear();
    }

    if (periodo === 'personalizado' && !isNaN(dataInicio) && !isNaN(dataFim)) {
      return dataRegistro >= dataInicio && dataRegistro <= dataFim;
    }

    return true;
  });
}


// Paginação
let paginaAtual = 1;
const registrosPorPagina = 10;

// Cria os controles de paginação
function criarPaginacao(totalPaginas) {
  let paginacaoContainer = document.getElementById("paginacao");
  if (!paginacaoContainer) {
    paginacaoContainer = document.createElement("div");
    paginacaoContainer.id = "paginacao";
    paginacaoContainer.style.textAlign = "center";
    paginacaoContainer.style.marginTop = "1rem";
    document.querySelector(".tabela").appendChild(paginacaoContainer);
  }

  paginacaoContainer.innerHTML = "";

  // Botões de Importar e Exportar
  const importarBtn = document.createElement("button");
  importarBtn.textContent = "Importar";
  importarBtn.style.margin = "0 10px";
  importarBtn.onclick = importarCSV;

  const exportarBtn = document.createElement("button");
  exportarBtn.textContent = "Exportar";
  exportarBtn.style.margin = "0 10px";
  exportarBtn.onclick = exportarCSV;

  

  const maxBotoesVisiveis = 6;
  let grupo = Math.floor((paginaAtual - 1) / maxBotoesVisiveis);
  let inicio = grupo * maxBotoesVisiveis + 1;
  let fim = Math.min(inicio + maxBotoesVisiveis - 1, totalPaginas);

  if (paginaAtual > 1) {
    const botaoPrimeira = document.createElement("button");
    botaoPrimeira.textContent = "«";
    botaoPrimeira.style.margin = "0 5px";
    botaoPrimeira.addEventListener("click", () => {
      paginaAtual = 1;
      atualizarTabela();
    });
    paginacaoContainer.appendChild(botaoPrimeira);
  }

  if (inicio > 1) {
    const botaoAnterior = document.createElement("button");
    botaoAnterior.textContent = "<";
    botaoAnterior.style.margin = "0 5px";
    botaoAnterior.addEventListener("click", () => {
      paginaAtual = inicio - 1;
      atualizarTabela();
    });
    paginacaoContainer.appendChild(botaoAnterior);
  }

  for (let i = inicio; i <= fim; i++) {
    const botao = document.createElement("button");
    botao.textContent = i;
    botao.style.margin = "0 5px";
    botao.style.padding = "5px 10px";
    botao.style.border = "none";
    botao.style.borderRadius = "4px";
    botao.style.cursor = "pointer";
    botao.style.background = i === paginaAtual ? "#f1c40f" : "#2c2c2c";
    botao.style.color = i === paginaAtual ? "#000" : "#fff";

    botao.addEventListener("click", () => {
      paginaAtual = i;
      atualizarTabela();
    });

    paginacaoContainer.appendChild(botao);
  }

  if (fim < totalPaginas) {
    const botaoProximo = document.createElement("button");
    botaoProximo.textContent = ">";
    botaoProximo.style.margin = "0 5px";
    botaoProximo.addEventListener("click", () => {
      paginaAtual = fim + 1;
      atualizarTabela();
    });
    paginacaoContainer.appendChild(botaoProximo);
  }

  if (paginaAtual < totalPaginas) {
    const botaoUltima = document.createElement("button");
    botaoUltima.textContent = "»";
    botaoUltima.style.margin = "0 5px";
    botaoUltima.addEventListener("click", () => {
      paginaAtual = totalPaginas;
      atualizarTabela();
    });
    paginacaoContainer.appendChild(botaoUltima);
  }
}

// Modifique essa função no seu script.js para suportar a nova lógica:
function atualizarTabela() {
  const tbody = tabela;
  tbody.innerHTML = "";

  const registrosFiltrados = filtrarPorPeriodo(registros);
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
  const inicio = (paginaAtual - 1) * registrosPorPagina;
  const fim = inicio + registrosPorPagina;
  const paginaDados = registrosFiltrados.slice(inicio, fim);

  paginaDados.forEach((r, index) => {
    const tr = document.createElement("tr");

    const tdData = document.createElement("td");
    tdData.textContent = r.data;
    tr.appendChild(tdData);


    const tdTipo = document.createElement("td");
tdTipo.textContent = r.tipo == "faturamento" ? "Faturamento" :
                     r.tipo == "Despesa de Casa" ? "Despesa de Casa" :
                     r.tipo == "Investimentos" ? "Investimentos" :
                     r.tipo == "Pagamentos de energia" ? "Pagamentos de energia" :
                     r.tipo == "Pagamento de funcionários" ? "Pagamento de funcionários" :
                     r.tipo; // fallback: mostra como está
tr.appendChild(tdTipo);


    const tdValor = document.createElement("td");
    tdValor.textContent = r.valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    tr.appendChild(tdValor);

    const tdDescricao = document.createElement("td");
tdDescricao.textContent = /^\d+$/.test(r.descricao.trim()) ? "--" : (r.descricao || "-");
tr.appendChild(tdDescricao);

    const tdAcoes = document.createElement("td");
    const btnRemover = document.createElement("button");
    btnRemover.textContent = "Remover";
    btnRemover.addEventListener("click", () => {
      const indexOriginal = registros.indexOf(r);
      registros.splice(indexOriginal, 1);
      atualizarTabela();
      atualizarResumo();
      atualizarGrafico();
    });
    tdAcoes.appendChild(btnRemover);
    tr.appendChild(tdAcoes);

    tbody.appendChild(tr);
  });

  criarPaginacao(totalPaginas);
}

const graficoPizzaCanvas = document.getElementById('graficoPizza');
const graficoBarrasCanvas = document.getElementById('graficoBarras');
let graficoPizza;
let graficoBarras;

function atualizarGraficosAdicionais() {
  const periodo = filtroPeriodo.value;
  const dados = filtrarPorPeriodo(periodo);

  const totalFaturamento = dados.filter(r => r.tipo === 'faturamento').reduce((s, r) => s + r.valor, 0);
  const totalInvestimentos = dados.filter(r => r.tipo === 'Investimentos').reduce((s, r) => s + r.valor, 0);
  const totalDespesadeCasa = dados.filter(r => r.tipo === 'Despesa de Casa').reduce((s, r) => s + r.valor, 0);
  const totalPagamentosdeenergia = dados.filter(r => r.tipo === 'Pagamentos de energia').reduce((s, r) => s + r.valor, 0);
  const totalPagamentodefuncionários = dados.filter(r => r.tipo === 'Pagamento de funcionários').reduce((s, r) => s + r.valor, 0);

  // Gráfico de Pizza
  if (graficoPizza) graficoPizza.destroy();
  graficoPizza = new Chart(graficoPizzaCanvas, {
    type: 'pie',
    data: {
      labels: ['Faturamento', 'Investimentos', 'Despesa de Casa', 'Pagamentos de energia', 'Pagamento de funcionários'],
      datasets: [{
        data: [totalFaturamento, totalInvestimentos, totalDespesadeCasa, totalPagamentosdeenergia, totalPagamentodefuncionários],
        backgroundColor: ['limegreen', 'red', 'blue', 'yellow', '#00554a'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // Gráfico de Barras por dia
  const datasUnicas = [...new Set(dados.map(r => r.data))].sort();
  const faturamentoPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'faturamento').reduce((s, r) => s + r.valor, 0);
  });
  const InvestimentosPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Investimentos').reduce((s, r) => s + r.valor, 0);
  });
  const DespesadeCasaPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Despesa de Casa').reduce((s, r) => s + r.valor, 0);
  });
  const PagamentosdeenergiaPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Pagamentos de energia').reduce((s, r) => s + r.valor, 0);
  });
  const PagamentodefuncionáriosPorData = datasUnicas.map(d => {
    return dados.filter(r => r.data === d && r.tipo === 'Pagamento de funcionários').reduce((s, r) => s + r.valor, 0);
  });

  if (graficoBarras) graficoBarras.destroy();
  graficoBarras = new Chart(graficoBarrasCanvas, {
    type: 'bar',
    data: {
      labels: datasUnicas,
      datasets: [
        {
          label: 'Faturamento',
          data: faturamentoPorData,
          backgroundColor: 'limegreen'
        },
        {
          label: 'Investimentos',
          data: InvestimentosPorData,
          backgroundColor: 'red'
        },
        {
          label: 'Despesa de Casa',
          data: DespesadeCasaPorData,
          backgroundColor: 'blue'
        },
        {
          label: 'Pagamentos de energia',
          data: PagamentosdeenergiaPorData,
          backgroundColor: 'yellow'
        },
        {
          label: 'Pagamento de funcionários',
          data: PagamentodefuncionáriosPorData,
          backgroundColor: '#00554a'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
const dataInicio = document.getElementById('dataInicio');
const dataFim = document.getElementById('dataFim');
const filtro = document.getElementById('filtroPeriodo');

function atualizarFiltroPersonalizado() {
  filtro.value = 'personalizado';
}

dataInicio.addEventListener('change', atualizarFiltroPersonalizado);
dataFim.addEventListener('change', atualizarFiltroPersonalizado);

document.getElementById('dataInicio').addEventListener('change', () => {
  if (filtroPeriodo.value === 'personalizado') {
    atualizarResumo();
    atualizarGrafico();
    atualizarTabela();
  }
});

document.getElementById('dataFim').addEventListener('change', () => {
  if (filtroPeriodo.value === 'personalizado') {
    atualizarResumo();
    atualizarGrafico();
    atualizarTabela();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('Service Worker registrado com sucesso'))
    .catch((erro) => console.error('Erro ao registrar Service Worker:', erro));
}

////////////////////////////////////////////////////////////////////////////////////////


document.getElementById('SalvarCSV').addEventListener('click', async () => {
  if (registros.length === 0) {
    alert('Nenhum dado para exportar.');
    return;
  }

  const token = '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'; // 🔒 Seu token com permissão repo
  const usuario = 'MauricioCruzdosSantos';
  const repo = 'MMControleFinaceiro';
  const caminho = 'backup_financeiro.csv';

  const csvHeader = "data,tipo,valor,descricao\n";
  const csvContent = registros.map(r =>
    `${r.data},${r.tipo},${Number(r.valor).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })},${(r.descricao || '').replace(/,/g, ' ')}`
  ).join("\n");
  const csvFinal = csvHeader + csvContent;
  const conteudoBase64 = btoa(unescape(encodeURIComponent(csvFinal)));

  let sha = null;

  // Verifica se o arquivo já existe
  try {
    const resposta = await fetch(`https://api.github.com/repos/${usuario}/${repo}/contents/${caminho}`, {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      sha = dados.sha;
    }
  } catch (erro) {
    console.warn('Arquivo ainda não existe, será criado.');
  }

  // Envia o novo conteúdo do arquivo
  try {
    const upload = await fetch(`https://api.github.com/repos/${usuario}/${repo}/contents/${caminho}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: '📦 Atualização automática do CSV via frontend',
        content: conteudoBase64,
        sha: sha // Se o arquivo não existe, esse campo será ignorado
      })
    });

    if (upload.ok) {
      alert(sha ? '✔ CSV atualizado no GitHub!' : '📁 CSV criado no GitHub com sucesso!');
    } else {
      const erro = await upload.json();
      console.error('Erro no upload:', erro);
      alert("❌ Falha ao salvar o CSV no GitHub.");
    }
  } catch (erro) {
    console.error('Erro ao enviar para GitHub:', erro);
    alert("❌ Erro de rede ou autenticação.");
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////

document.getElementById('BuscarCSV').addEventListener('click', async () => {
  const usuario = 'MauricioCruzdosSantos';
  const repo = 'MMControleFinaceiro';
  const caminho = 'backup_financeiro.csv';
  const url = `https://raw.githubusercontent.com/${usuario}/${repo}/main/${caminho}`;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) {
      throw new Error(`Erro ao buscar o arquivo CSV do GitHub. Código: ${resposta.status}`);
    }

    const csv = await resposta.text();

    const linhas = csv.split('\n').slice(1); // pula o cabeçalho
    registros = linhas.filter(l => l.trim() !== '').map(linha => {
      const [data, tipo, valor, descricao] = linha.split(',');
      return {
        data,
        tipo,
        valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')),
        descricao: descricao || ''
      };
    });

    // Atualiza a interface
    atualizarTabela();
    atualizarResumo();
    atualizarGrafico();

    alert('📥 Dados carregados com sucesso do GitHub!');
  } catch (erro) {
    console.error("❌ Erro ao carregar CSV do GitHub:", erro);
    alert("❌ Não foi possível carregar os dados do GitHub.");
  }
});


//📂
