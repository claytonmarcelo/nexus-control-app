import React, { useEffect, useRef } from 'react';

/**
 * DashboardCanvas - Gráficos nativos HTML5 Canvas sem dependências externas
 * Renderiza vendas por mês, distribuição de categorias e KPIs
 */

export default function DashboardCanvas() {
  const canvasRef = useRef(null);
  const pieCanvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawLineChart(canvasRef.current);
    }
    if (pieCanvasRef.current) {
      drawPieChart(pieCanvasRef.current);
    }
  }, []);

  const drawLineChart = (canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Sample data (vendas por mês)
    const data = [12000, 19000, 15000, 25000, 22000, 28000];
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const maxValue = Math.max(...data);

    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw line chart
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = height - padding - (chartHeight / maxValue) * value;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.05)');

    ctx.fillStyle = gradient;
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw points
    ctx.fillStyle = '#D4AF37';
    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = height - padding - (chartHeight / maxValue) * value;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#F0D98A';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      ctx.fillText(label, x, height - padding + 20);
    });

    // Draw Y-axis values
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * i);
      const y = height - padding - (chartHeight / 5) * i;
      ctx.fillText(`R$${(value / 1000).toFixed(0)}k`, padding - 10, y + 4);
    }
  };

  const drawPieChart = (canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    // Sample data (distribuição de categorias)
    const categories = [
      { name: 'Servidores', value: 35, color: '#D4AF37' },
      { name: 'Rede', value: 28, color: '#E5C158' },
      { name: 'Segurança', value: 22, color: '#F0D98A' },
      { name: 'Serviços', value: 15, color: '#B8962E' },
    ];

    const total = categories.reduce((sum, cat) => sum + cat.value, 0);

    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);

    // Draw pie slices
    let currentAngle = -Math.PI / 2;
    categories.forEach((category) => {
      const sliceAngle = (category.value / total) * Math.PI * 2;

      // Draw slice
      ctx.fillStyle = category.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#121212';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#121212';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${category.value}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Draw legend
    const legendStartY = height - 100;
    const legendX = 20;
    ctx.textAlign = 'left';

    categories.forEach((category, index) => {
      const y = legendStartY + index * 20;

      // Color box
      ctx.fillStyle = category.color;
      ctx.fillRect(legendX, y, 12, 12);

      // Label
      ctx.fillStyle = '#F0D98A';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`${category.name} (${category.value}%)`, legendX + 20, y + 10);
    });
  };

  return (
    <div className="space-y-8">
      {/* Line Chart - Vendas por Mês */}
      <div className="glass rounded-2xl p-6 border border-dark-border">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>📈</span>
          Vendas por Mês
        </h3>
        <canvas
          ref={canvasRef}
          className="w-full bg-dark-card/50 rounded-xl"
          style={{ height: '300px' }}
        />
      </div>

      {/* Pie Chart - Distribuição de Categorias */}
      <div className="glass rounded-2xl p-6 border border-dark-border">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          Distribuição por Categoria
        </h3>
        <canvas
          ref={pieCanvasRef}
          className="w-full bg-dark-card/50 rounded-xl"
          style={{ height: '350px' }}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard icon="💰" label="Faturamento" value="R$ 121.000" change="+12.5%" />
        <KPICard icon="📦" label="Pedidos" value="87" change="+5.2%" />
        <KPICard icon="👥" label="Clientes" value="42" change="+8.1%" />
        <KPICard icon="⭐" label="Avaliação" value="4.8/5" change="+0.3%" />
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, change }) {
  const isPositive = change.startsWith('+');

  return (
    <div className="glass rounded-xl p-4 border border-dark-border">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
      <p className="text-xs text-nexus-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
