import React, { useRef } from 'react';

/**
 * ReceiptPrintable - Comprovante de compra formatado para impressão PDF
 * Compatível com @media print para gerar PDF nativo do navegador
 */

export default function ReceiptPrintable({ order, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
          }
          body {
            background: white;
            color: #000;
            font-family: 'Courier New', monospace;
          }
          .receipt-container {
            width: 80mm;
            margin: 0 auto;
            padding: 0;
            background: white;
            color: black;
          }
          .print-only { display: block; }
          .no-print { display: none; }
          .glass { background: white; border: 1px solid #000; }
          .btn { display: none; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      {/* Modal Backdrop (screen only) */}
      <div
        className="no-print modal-overlay"
        onClick={onClose}
      >
        <div
          className="glass rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Comprovante de Compra</h2>
            <button
              onClick={onClose}
              className="text-nexus-400 hover:text-nexus-300 text-2xl"
            >
              ×
            </button>
          </div>

          <Receipt ref={receiptRef} order={order} />

          <div className="flex gap-3 mt-6 no-print">
            <button
              onClick={handlePrint}
              className="btn btn-primary flex-1"
            >
              🖨️ Imprimir/PDF
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Print Version */}
      <div className="print-only">
        <div className="receipt-container p-4">
          <Receipt ref={receiptRef} order={order} />
        </div>
      </div>
    </>
  );
}

const Receipt = React.forwardRef(({ order }, ref) => {
  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div ref={ref} className="space-y-4 text-sm">
      {/* Header */}
      <div className="text-center border-b-2 border-dark-border pb-3">
        <h1 className="text-lg font-bold">NEXUS CONTROL</h1>
        <p className="text-xs text-nexus-400">Sistemas de Gestão Empresarial</p>
        <p className="text-xs text-nexus-400 mt-1">CNPJ: 00.000.000/0001-00</p>
      </div>

      {/* Order Info */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Pedido #:</span>
          <span className="font-semibold">{order?.id || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Data:</span>
          <span>{formatDate(order?.createdAt || new Date())}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="font-semibold text-green-600">
            {order?.statusPagamento === 'confirmado' ? 'PAGO' : 'PROCESSANDO'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-b border-dark-border py-3">
        <div className="text-xs font-semibold mb-2 grid grid-cols-3 gap-2">
          <span>Descrição</span>
          <span className="text-right">Qtd</span>
          <span className="text-right">Total</span>
        </div>
        <div className="space-y-2">
          {(order?.items || []).map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 text-xs">
              <span className="truncate">{item.nome || item}</span>
              <span className="text-right">
                {item.quantidade || item.qtd || 1}
              </span>
              <span className="text-right font-semibold">
                {formatCurrency(
                  (item.precoUnitario || item.valor || 0) * (item.quantidade || item.qtd || 1)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-1 text-xs border-t border-dark-border pt-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency((order?.total || 0) * 0.9)}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Desconto:</span>
          <span>-{formatCurrency((order?.total || 0) * 0.1)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-dark-border pt-2 mt-2">
          <span>TOTAL:</span>
          <span>{formatCurrency(order?.total || 0)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="text-center border-t border-dark-border pt-3 text-xs">
        <p className="font-semibold">
          Pagamento: {order?.metodoPagamento === 'pix' ? 'PIX' : 'CARTÃO CRÉDITO'}
        </p>
        {order?.metodoPagamento === 'pix' && (
          <p className="text-nexus-400 mt-1">Transação PIX confirmada</p>
        )}
      </div>

      {/* Footer */}
      <div className="text-center border-t border-dark-border pt-3 text-xs text-nexus-400 space-y-1">
        <p>Obrigado pela sua compra!</p>
        <p>www.nexuscontrol.com</p>
        <p className="mt-3 font-semibold">☺ Visite novamente ☺</p>
      </div>

      {/* Print-only Footer */}
      <div className="print-only text-center mt-6 text-xs">
        <p>Comprovante impresso em: {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
