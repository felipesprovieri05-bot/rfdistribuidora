
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/5 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <div className="text-2xl font-bold tracking-tighter mb-2">RF<span className="text-[#FF4500]"> DISTRIBUIDORA</span></div>
          <p className="text-gray-500 text-sm max-w-xs">Experiência premium em bebidas e gastronomia artesanal. Qualidade em cada detalhe.</p>
        </div>
        
        <div className="flex gap-8">
          <div>
            <h5 className="font-bold mb-4 text-[#FF4500]">Funcionamento</h5>
            <p className="text-gray-400 text-sm">Ter - Qui: 17h às 23h</p>
            <p className="text-gray-400 text-sm">Sex - Sáb: 17h às 01h</p>
            <p className="text-gray-400 text-sm">Dom: 12h às 22h</p>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#FF4500]">Contato</h5>
            <p className="text-gray-400 text-sm">(11) 98765-4321</p>
            <p className="text-gray-400 text-sm">Rua das Flores, 123</p>
            <p className="text-gray-400 text-sm">São Paulo, SP</p>
          </div>
        </div>
      </div>
      <div className="text-center mt-12 pt-8 border-t border-white/5 text-gray-600 text-xs">
        &copy; 2024 RF Distribuidora. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;
