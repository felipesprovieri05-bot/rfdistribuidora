
import React from 'react';

const Hero: React.FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-[90vh] flex items-center justify-center px-4 overflow-hidden">
      {/* Background Image with Parallax-like feel */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&q=80&w=1920" 
          alt="RF Distribuidora Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black"></div>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#FF4500] opacity-20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#FF4500] opacity-10 blur-[120px] rounded-full"></div>

      <div className="max-w-5xl text-center z-10 space-y-8">
        <div className="inline-block glass px-4 py-1.5 rounded-full border border-white/20 text-[#FF4500] text-sm font-bold tracking-widest uppercase mb-4 animate-bounce">
          Estilo & Sabor Premium
        </div>
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-6 leading-[0.9] drop-shadow-2xl">
          PARA QUEM <span className="text-[#FF4500]">APRECIA</span> O MELHOR.
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          Dos melhores vinhos às cervejas mais geladas e burguers artesanais. 
          Sua parada obrigatória para momentos inesquecíveis.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <button 
            onClick={() => scrollToSection('menu')}
            className="w-full md:w-auto px-12 py-5 bg-[#FF4500] text-white font-black rounded-2xl hover:scale-110 transition-all text-xl orange-glow shadow-2xl shadow-[#FF4500]/30"
          >
            FAZER PEDIDO
          </button>
          <button 
            onClick={() => scrollToSection('reservas')}
            className="w-full md:w-auto px-12 py-5 glass border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-xl"
          >
            RESERVAR MESA
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
