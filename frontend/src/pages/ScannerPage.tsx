import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { api } from '../services/api';
import { Camera, AlertCircle, ArrowLeft, Search, Smartphone, Upload, RefreshCw, ShieldAlert } from 'lucide-react';

export const ScannerPage: React.FC = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [insecureContext, setInsecureContext] = useState(false);
  const [scanningFile, setScanningFile] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    isMountedRef.current = true;
    startCameraScanner();

    return () => {
      isMountedRef.current = false;
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Failed to stop scanner:", e);
      }
    }
    if (isMountedRef.current) {
      setCameraActive(false);
    }
  };

  const startCameraScanner = async () => {
    if (!isMountedRef.current) return;
    setPermissionDenied(false);
    setInsecureContext(false);
    setErrorMsg(null);

    // 1. Check if mediaDevices is supported in current context
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (window.isSecureContext === false) {
        setInsecureContext(true);
      } else {
        setPermissionDenied(true);
      }
      setCameraActive(false);
      return;
    }

    try {
      await stopCameraScanner();

      const html5QrCode = new Html5Qrcode("reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      // Wider rectangular qrbox adapted for standard horizontal 1D food barcodes
      const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
        const width = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
        const height = Math.min(Math.floor(width * 0.52), 180);
        return { width: Math.max(width, 220), height: Math.max(height, 110) };
      };

      const config = {
        fps: 15,
        qrbox,
        aspectRatio: 1.0,
      };

      // Determine best camera: back/rear camera priority
      let cameraConstraint: string | { facingMode: string } = { facingMode: "environment" };

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCam = devices.find(d => 
            /back|rear|traseira|environment/i.test(d.label)
          );
          if (backCam) {
            cameraConstraint = backCam.id;
          } else {
            cameraConstraint = devices.length > 1 ? devices[devices.length - 1].id : devices[0].id;
          }
        }
      } catch {
        // Camera enumeration not granted yet, fallback to constraint
      }

      try {
        await html5QrCode.start(
          cameraConstraint,
          config,
          (decodedText) => {
            handleBarcodeDetected(decodedText);
          },
          () => {}
        );
      } catch (primaryErr) {
        console.warn("Primary camera constraint failed, attempting fallback:", primaryErr);
        // Fallback to user camera or default facing mode
        await html5QrCode.start(
          { facingMode: "user" },
          config,
          (decodedText) => {
            handleBarcodeDetected(decodedText);
          },
          () => {}
        );
      }

      if (isMountedRef.current) {
        setCameraActive(true);
        setPermissionDenied(false);
      } else {
        await stopCameraScanner();
      }
    } catch (err: any) {
      console.warn("Camera access failed completely:", err);
      if (isMountedRef.current) {
        setPermissionDenied(true);
        setCameraActive(false);
      }
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode || loading) return;

    if (navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {}
    }

    setScannedCode(barcode);
    await stopCameraScanner();
    lookupBarcode(barcode);
  };

  const lookupBarcode = async (barcode: string) => {
    const cleanBarcode = barcode.trim();
    setLoading(true);
    setErrorMsg(null);
    try {
      const product = await api.getProductByBarcode(cleanBarcode);
      if (product && product.id) {
        navigate(`/products/${product.id}`);
      } else {
        setErrorMsg(`Produto com código ${cleanBarcode} não foi encontrado.`);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('comunicar') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        setErrorMsg(`Erro de ligação ao servidor. Confirma que o backend FITGORDO está em execução.`);
      } else {
        setErrorMsg(`Produto (${cleanBarcode}) não encontrado na nossa base de dados nem no Open Food Facts.`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningFile(true);
    setErrorMsg(null);

    try {
      await stopCameraScanner();

      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode("reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;
      }

      const result = await scanner.scanFileV2(file, true);
      if (result && result.decodedText) {
        handleBarcodeDetected(result.decodedText);
      } else {
        setErrorMsg('Não foi possível identificar o código de barras na foto. Tenta com melhor foco e iluminação.');
      }
    } catch (err) {
      setErrorMsg('Não foi possível ler o código na imagem. Tenta aproximar ou escrever manualmente.');
    } finally {
      if (isMountedRef.current) {
        setScanningFile(false);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      {/* iOS Camera Tip */}
      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-zinc-300">
        <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          <strong>Dica iPhone:</strong> Aponta o código de barras horizontalmente na linha central para leitura imediata.
        </span>
      </div>

      {/* Hidden file input for direct photo capture / gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Camera Viewport Box */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border-2 border-emerald-500/40 shadow-2xl min-h-[300px] flex items-center justify-center">
        <div id="reader" className="w-full h-full min-h-[300px]"></div>

        {insecureContext && (
          <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-bold text-white">Ligação HTTP Não Segura</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              O Safari no iOS bloqueia o vídeo da câmara quando acedido por IP local HTTP (requer HTTPS ou localhost).
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Tirar Foto ao Código</span>
            </button>
          </div>
        )}

        {permissionDenied && !insecureContext && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
            <Camera className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-bold text-white">Acesso à câmara indisponível</p>
            <p className="text-xs text-zinc-400">
              Permite o acesso à câmara no navegador ou tira uma fotografia ao código.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              <button
                onClick={startCameraScanner}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Carregar Foto</span>
              </button>
            </div>
          </div>
        )}

        {(loading || scanningFile) && (
          <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-white">
              {scanningFile ? 'A ler imagem do código...' : `A procurar produto (${scannedCode || ''})...`}
            </p>
            <p className="text-xs text-zinc-400">Consultando base local e Open Food Facts Portugal</p>
          </div>
        )}
      </div>

      {/* Alternative Action: Photo Upload Fallback */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || scanningFile}
          className="flex-1 py-3 px-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Fotografar ou Carregar Imagem</span>
        </button>
        {cameraActive && (
          <button
            onClick={startCameraScanner}
            title="Reiniciar câmara"
            className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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
              onClick={() => navigate(`/products/new?barcode=${scannedCode || manualCode.trim() || ''}`)}
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
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
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
