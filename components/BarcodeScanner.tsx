'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
  continuous?: boolean; // Modo contínuo - não fecha após escanear
  showSuccessFeedback?: boolean; // Mostrar feedback visual ao escanear
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  onClose, 
  title = 'Escaneie o Código de Barras',
  continuous = false,
  showSuccessFeedback = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanTime = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    isMountedRef.current = true;
    startScanner();
    
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Câmera não disponível neste navegador. Use a entrada manual.');
      setIsScanning(false);
      return;
    }

    try {
      setError('');
      setIsScanning(true);

      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira em dispositivos móveis
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current && isMountedRef.current) {
        const video = videoRef.current;
        
        // Aguardar que o vídeo esteja pronto antes de tentar reproduzir
        await new Promise<void>((resolve) => {
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          };
          
          const handleCanPlay = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          };
          
          // Ouvir ambos os eventos para garantir que o vídeo esteja pronto
          video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
          video.addEventListener('canplay', handleCanPlay, { once: true });
          
          // Definir srcObject
          video.srcObject = stream;
        });
        
        if (!isMountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Tentar reproduzir - tratar AbortError silenciosamente
        try {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise.catch((err: any) => {
              // Ignorar AbortError - significa que uma nova tentativa foi feita (comportamento normal)
              if (err.name !== 'AbortError') {
                throw err;
              }
            });
          }
        } catch (err: any) {
          // Se não for AbortError, apenas logar (não bloquear funcionalidade)
          if (err.name !== 'AbortError' && isMountedRef.current) {
            console.warn('Aviso ao reproduzir vídeo:', err.name);
          }
        }
        
        // Iniciar escaneamento mesmo se houver erro (o vídeo pode funcionar)
        if (isMountedRef.current) {
          scanBarcode();
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      // Não logar NotAllowedError no console - é um erro esperado quando usuário nega permissão
      if (err.name !== 'NotAllowedError') {
        console.error('Erro ao acessar câmera:', err);
      }
      
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.'
        : err.name === 'NotFoundError'
        ? 'Nenhuma câmera encontrada no dispositivo.'
        : err.message || 'Não foi possível acessar a câmera. Verifique as permissões.';
      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      // Pausar o vídeo antes de remover srcObject para evitar AbortError
      try {
        videoRef.current.pause();
      } catch (e) {
        // Ignorar erros ao pausar
      }
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanBarcode = () => {
    if (!isMountedRef.current) return;
    
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      if (isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanBarcode);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanBarcode);
      }
      return;
    }

    try {
      // Configurar canvas com tamanho do vídeo
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Desenhar frame atual no canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Verificar BarcodeDetector API se disponível
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const BarcodeDetectorClass = (window as any).BarcodeDetector;
            
            if (BarcodeDetectorClass && typeof BarcodeDetectorClass === 'function') {
              const detector = new BarcodeDetectorClass({
                formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
              });

              if (detector && typeof detector.detect === 'function') {
                detector.detect(imageData)
                  .then((detectedCodes: any[]) => {
                    if (!isMountedRef.current) return;
                    
                    if (detectedCodes && Array.isArray(detectedCodes) && detectedCodes.length > 0) {
                      const now = Date.now();
                      // Prevenir múltiplas detecções em menos de 1 segundo
                      if (now - lastScanTime.current > 1000) {
                        lastScanTime.current = now;
                        const barcode = detectedCodes[0]?.rawValue;
                        if (barcode && typeof barcode === 'string' && barcode.length > 0) {
                          setLastScannedCode(barcode);
                          if (showSuccessFeedback) {
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 1000);
                          }
                          onScan(barcode);
                          
                          // Se não for modo contínuo, fechar scanner
                          if (!continuous) {
                            stopScanner();
                            return;
                          }
                          // No modo contínuo, continuar escaneando
                        }
                      }
                    }
                    if (isMountedRef.current) {
                      animationFrameRef.current = requestAnimationFrame(scanBarcode);
                    }
                  })
                  .catch(() => {
                    if (isMountedRef.current) {
                      animationFrameRef.current = requestAnimationFrame(scanBarcode);
                    }
                  });
                return;
              }
            }
          } catch (e) {
            // Se BarcodeDetector não funcionar, continuar loop
            console.warn('BarcodeDetector error:', e);
          }
        }
      }
      
      // Fallback: continuar escaneando mas permitir entrada manual
      if (isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanBarcode);
      }
    } catch (error) {
      // Em caso de erro, continuar o loop apenas se ainda montado
      if (isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanBarcode);
      }
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Apenas atualizar estado, não processar aqui
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value.length >= 8) {
        setLastScannedCode(value);
        if (showSuccessFeedback) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 1000);
        }
        onScan(value);
        e.currentTarget.value = ''; // Limpar campo
        if (!continuous) {
          stopScanner();
        }
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input[type="text"]') as HTMLInputElement;
    if (input && input.value.trim().length >= 8) {
      const barcode = input.value.trim();
      setLastScannedCode(barcode);
      if (showSuccessFeedback) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1000);
      }
      onScan(barcode);
      input.value = ''; // Limpar campo
      if (!continuous) {
        stopScanner();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="glass w-full max-w-2xl p-8 rounded-[3rem] border border-[#FF4500]/30 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
            {title}
          </h3>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-gray-500 hover:text-white text-3xl font-black transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl">
            <p className="text-red-400 text-sm font-bold">{error}</p>
            <p className="text-gray-400 text-xs mt-2">
              Você pode digitar o código manualmente no campo abaixo.
            </p>
          </div>
        )}

        {showSuccess && lastScannedCode && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-2xl animate-in zoom-in-95 duration-200">
            <p className="text-green-400 text-sm font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Código escaneado: <span className="font-mono">{lastScannedCode}</span>
            </p>
            {continuous && (
              <p className="text-gray-400 text-xs mt-2">
                Continue escaneando mais produtos ou feche quando terminar.
              </p>
            )}
          </div>
        )}

        {continuous && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-2xl animate-pulse">
            <p className="text-blue-400 text-xs font-black text-center uppercase tracking-widest">
              🎯 MODO CONTÍNUO ATIVO
            </p>
            <p className="text-blue-300 text-[10px] text-center mt-1 font-bold">
              Escaneie múltiplos produtos sem fechar o scanner
            </p>
          </div>
        )}

        <div className="relative mb-6 bg-black rounded-2xl overflow-hidden border-2 border-[#FF4500]/50">
          <video
            ref={videoRef}
            className="w-full h-auto max-h-[400px] object-contain"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          {isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-[#FF4500] rounded-xl w-3/4 h-48 flex items-center justify-center">
                <p className="text-white font-black text-sm bg-black/50 px-4 py-2 rounded-lg">
                  Posicione o código de barras aqui
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 mb-2 block">
              Ou digite o código manualmente (mínimo 8 dígitos)
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] text-white font-mono font-black tracking-widest text-lg"
              placeholder={continuous ? "Digite o código e pressione Enter (continuar escaneando)" : "Digite o código de barras e pressione Enter"}
              onChange={handleManualInput}
              onKeyDown={handleManualKeyDown}
              autoFocus
              minLength={8}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                stopScanner();
                startScanner();
              }}
              className="flex-1 py-4 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-black rounded-2xl hover:bg-blue-500/30 transition-all uppercase tracking-widest text-sm"
            >
              {isScanning ? 'Reiniciar Scanner' : 'Iniciar Scanner'}
            </button>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="flex-1 py-4 bg-gray-500/20 border border-gray-500/50 text-gray-400 font-black rounded-2xl hover:bg-gray-500/30 transition-all uppercase tracking-widest text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BarcodeScanner;
