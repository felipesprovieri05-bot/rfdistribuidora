/**
 * Utilitário para gerar PDF financeiro com todas as métricas e dados
 */

interface FinancialData {
  date: string;
  time: string;
  kpis: {
    customers: { value: number; change: number };
    orders: { value: number; change: number };
    profit: { value: number; change: number };
    growth: { value: number; change: number };
    products: { value: number; change: number };
  };
  monthlyData: {
    month: string;
    atuais: number;
    projecoes: number;
    atuaisProfit: number;
    projecoesProfit: number;
  }[];
  categoryData: {
    categories: {
      category: string;
      value: number;
      percentage: number;
      cmv: number;
      profit: number;
    }[];
    total: number;
    monthlyProfit: number;
    monthlyRevenue: number;
    monthlyCMV: number;
    monthlyExpenses: number;
  };
  weeklyData: {
    day: string;
    currentWeek: number;
    previousWeek: number;
    profit: number;
    profitMargin: number;
  }[];
}

export const generateFinancialPDF = (data: FinancialData): void => {
  if (typeof window === 'undefined') return;

  try {
    // Criar conteúdo HTML para o PDF
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório Financeiro - ${data.date}</title>
  <style>
    @page {
      margin: 20mm;
      size: A4;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #000;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #FF4500;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #FF4500;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 5px 0;
      font-size: 12px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      background: #FF4500;
      color: #fff;
      padding: 10px 15px;
      margin-bottom: 15px;
      font-weight: bold;
      font-size: 16px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .kpi-item {
      border: 1px solid #ddd;
      padding: 15px;
      text-align: center;
      border-radius: 5px;
    }
    .kpi-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: bold;
      color: #000;
      margin-bottom: 5px;
    }
    .kpi-change {
      font-size: 10px;
      color: #666;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .table th, .table td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
      font-size: 11px;
    }
    .table th {
      background: #f5f5f5;
      font-weight: bold;
      color: #000;
    }
    .table td {
      color: #333;
    }
    .positive {
      color: #10b981;
      font-weight: bold;
    }
    .negative {
      color: #ef4444;
      font-weight: bold;
    }
    .summary-box {
      background: #f9f9f9;
      border: 2px solid #FF4500;
      padding: 20px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .summary-label {
      font-weight: bold;
      color: #333;
    }
    .summary-value {
      font-weight: bold;
      color: #000;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>RELATÓRIO FINANCEIRO COMPLETO</h1>
    <p>Data: ${data.date} | Hora: ${data.time}</p>
    <p>RF - Sistema de Gestão Financeira</p>
  </div>

  <div class="section">
    <div class="section-title">INDICADORES PRINCIPAIS (KPI) - Últimos 30 dias</div>
    <div class="kpi-grid">
      <div class="kpi-item">
        <div class="kpi-label">Clientes</div>
        <div class="kpi-value">${data.kpis.customers.value.toLocaleString('pt-BR')}</div>
        <div class="kpi-change ${data.kpis.customers.change >= 0 ? 'positive' : 'negative'}">
          ${data.kpis.customers.change >= 0 ? '↑' : '↓'} ${Math.abs(data.kpis.customers.change).toFixed(2)}%
        </div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">Pedidos</div>
        <div class="kpi-value">${data.kpis.orders.value.toLocaleString('pt-BR')}</div>
        <div class="kpi-change ${data.kpis.orders.change >= 0 ? 'positive' : 'negative'}">
          ${data.kpis.orders.change >= 0 ? '↑' : '↓'} ${Math.abs(data.kpis.orders.change).toFixed(2)}%
        </div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">Lucro</div>
        <div class="kpi-value">R$ ${data.kpis.profit.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="kpi-change ${data.kpis.profit.change >= 0 ? 'positive' : 'negative'}">
          ${data.kpis.profit.change >= 0 ? '↑' : '↓'} ${Math.abs(data.kpis.profit.change).toFixed(2)}%
        </div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">Crescimento</div>
        <div class="kpi-value">${data.kpis.growth.value.toFixed(2)}%</div>
        <div class="kpi-change ${data.kpis.growth.change >= 0 ? 'positive' : 'negative'}">
          ${data.kpis.growth.change >= 0 ? '↑' : '↓'} ${Math.abs(data.kpis.growth.change).toFixed(2)}%
        </div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">Produtos</div>
        <div class="kpi-value">${data.kpis.products.value.toLocaleString('pt-BR')}</div>
        <div class="kpi-change ${data.kpis.products.change >= 0 ? 'positive' : 'negative'}">
          ${data.kpis.products.change >= 0 ? '↑' : '↓'} ${Math.abs(data.kpis.products.change).toFixed(2)}%
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">RESUMO FINANCEIRO MENSAL</div>
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">Receita Total:</span>
        <span class="summary-value">R$ ${data.categoryData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">CMV (Custo das Mercadorias Vendidas):</span>
        <span class="summary-value">R$ ${data.categoryData.monthlyCMV.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Despesas:</span>
        <span class="summary-value">R$ ${data.categoryData.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row" style="border-bottom: none; padding-top: 15px; margin-top: 10px; border-top: 2px solid #FF4500;">
        <span class="summary-label" style="font-size: 16px;">LUCRO MENSAL GERAL:</span>
        <span class="summary-value" style="font-size: 18px; color: ${data.categoryData.monthlyProfit >= 0 ? '#10b981' : '#ef4444'}">
          R$ ${data.categoryData.monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div class="summary-row" style="border-bottom: none; padding-top: 10px;">
        <span class="summary-label">Margem de Lucro:</span>
        <span class="summary-value" style="color: ${data.categoryData.monthlyRevenue > 0 ? (data.categoryData.monthlyProfit / data.categoryData.monthlyRevenue * 100) >= 0 ? '#10b981' : '#ef4444' : '#666'}">
          ${data.categoryData.monthlyRevenue > 0 ? ((data.categoryData.monthlyProfit / data.categoryData.monthlyRevenue) * 100).toFixed(2) : '0.00'}%
        </span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">PROJEÇÕES X ATUAIS - Anual</div>
    <table class="table">
      <thead>
        <tr>
          <th>Mês</th>
          <th>Receita Atual</th>
          <th>Receita Projetada</th>
          <th>Lucro Atual</th>
          <th>Lucro Projetado</th>
        </tr>
      </thead>
      <tbody>
        ${data.monthlyData.map(m => `
          <tr>
            <td><strong>${m.month.toUpperCase()}</strong></td>
            <td>R$ ${m.atuais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>R$ ${m.projecoes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${m.atuaisProfit >= 0 ? 'positive' : 'negative'}">R$ ${m.atuaisProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${m.projecoesProfit >= 0 ? 'positive' : 'negative'}">R$ ${m.projecoesProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${data.categoryData.categories.length > 0 ? `
  <div class="section">
    <div class="section-title">VENDAS POR CATEGORIA</div>
    <table class="table">
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Receita</th>
          <th>% do Total</th>
          <th>CMV</th>
          <th>Lucro</th>
          <th>Margem</th>
        </tr>
      </thead>
      <tbody>
        ${data.categoryData.categories.map(cat => {
          const margin = cat.value > 0 ? ((cat.profit / cat.value) * 100) : 0;
          return `
          <tr>
            <td><strong>${cat.category}</strong></td>
            <td>R$ ${cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${cat.percentage.toFixed(1)}%</td>
            <td>R$ ${cat.cmv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${cat.profit >= 0 ? 'positive' : 'negative'}">R$ ${cat.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${margin >= 0 ? 'positive' : 'negative'}">${margin.toFixed(2)}%</td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.weeklyData.length > 0 ? `
  <div class="section">
    <div class="section-title">FATURAMENTO SEMANAL</div>
    <table class="table">
      <thead>
        <tr>
          <th>Dia</th>
          <th>Esta Semana</th>
          <th>Semana Anterior</th>
          <th>Lucro</th>
          <th>Margem %</th>
        </tr>
      </thead>
      <tbody>
        ${data.weeklyData.map(w => `
          <tr>
            <td><strong>${w.day}</strong></td>
            <td>R$ ${w.currentWeek.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>R$ ${w.previousWeek.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${w.profit >= 0 ? 'positive' : 'negative'}">R$ ${w.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${w.profitMargin >= 0 ? 'positive' : 'negative'}">${w.profitMargin.toFixed(2)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Relatório gerado automaticamente pelo Sistema RF</p>
    <p>${data.date} às ${data.time}</p>
  </div>
</body>
</html>
    `;

    // Criar janela para impressão/PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('❌ Não foi possível abrir a janela de impressão. Por favor, permita pop-ups para este site.');
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Aguardar o conteúdo carregar e então abrir diálogo de impressão
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Nota: A janela permanece aberta para o usuário salvar como PDF
        // O usuário pode fechar manualmente após salvar
      }, 500);
    };
    
    // Fallback: se onload não disparar, tentar após 1 segundo
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.warn('Erro ao abrir diálogo de impressão:', e);
        }
      }
    }, 1000);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('❌ Erro ao gerar PDF financeiro. Verifique o console para mais detalhes.');
  }
};
