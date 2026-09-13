import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { Product } from '../types';
import { Camera, QrCode, AlertCircle, ArrowLeft, Search, CheckCircle2 } from 'lucide-react';

export const ScannerPage: React.FC = () => {
  const [scanning, setScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    startCameraScanner();
    return () => {
      stopCameraScanner();
    };
  }, []);

  const startCameraScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // ignore scan errors per frame
        }
      );
    } catch (err) {
      console.warn("Camera access failed or unavailable:", err);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Failed to stop scanner:", e);
      }
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || loading) return;
    
    // Play haptic feedback if available on iOS/Safari
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    setScannedCode(barcode);
    stopCameraScanner();
    lookupBarcode(barcode);
  };

  const lookupBarcode = async (barcode: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const product = await api.getProductByBarcode(barcode);
      if (product && product.id) {
        navigate(`/products/${product.id}`);
      } else {
        setErrorMsg(`Produto com código ${barcode} não foi encontrado.`);
      }
    } catch (err: any) {
      setErrorMsg(`Produto (${barcode}) não encontrado na nossa base de dados nem no Open Food Facts.`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h2 className="text-base font-bold text-white">Scanner de Código de Barras</h2>
        <div className="w-12"></div>
      </div>

      {/* Camera Viewport Box */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border-2 border-emerald-500/40 shadow-2xl min-h-[300px] flex items-center justify-center">
        <div id="reader" className="w-full h-full min-h-[300px]"></div>

        {loading && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-white">A procurar produto ({scannedCode})...</p>
            <p className="text-xs text-zinc-400">Consultando base local e Open Food Facts</p>
          </div>
        )}
      </div>

      {/* Error / Not Found State */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-xs font-bold">{errorMsg}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setErrorMsg(null);
                setScannedCode(null);
                startCameraScanner();
              }}
              className="flex-1 text-xs font-bold py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => navigate(`/products/new?barcode=${scannedCode || ''}`)}
              className="flex-1 text-xs font-bold py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-xl transition-colors"
            >
              Criar manualmente
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Fallback */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-emerald-400" />
          <span>Escrever código de barras manualmente</span>
        </h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: 5601234567890"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || loading}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl disabled:opacity-50 transition-colors"
          >
            Procurar
          </button>
        </form>
      </div>
    </div>
  );
};
