
import React from 'react';

const WhatsAppButton: React.FC = () => {
  const phoneNumber = "5511987654321"; // Número de exemplo
  const message = encodeURIComponent("Olá! Gostaria de tirar uma dúvida sobre a Adega e Lanchonete.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[60] group flex items-center gap-3 transition-all duration-300"
      aria-label="Fale conosco no WhatsApp"
    >
      {/* Tooltip moderno - agora posicionado à esquerda do botão por conta do flex-row */}
      <span className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 glass px-4 py-2 rounded-xl text-sm font-bold text-white transition-all duration-300 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg">
        Fale Conosco!
      </span>

      {/* Botão Principal */}
      <div className="relative">
        <div className="absolute inset-0 bg-[#FF4500] rounded-full blur-md opacity-20 group-hover:opacity-40 animate-pulse transition-opacity"></div>
        <div className="glass w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border border-[#FF4500]/30 group-hover:border-[#FF4500] transition-all duration-300 shadow-2xl relative overflow-hidden group-hover:scale-110 active:scale-95">
          {/* Background Glow Interior */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4500]/10 to-transparent"></div>
          
          <svg 
            className="w-7 h-7 md:w-8 md:h-8 text-white group-hover:text-[#FF4500] transition-colors relative z-10" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.66 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </div>
      </div>
    </a>
  );
};

export default WhatsAppButton;
