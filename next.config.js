/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração para suportar variáveis de ambiente
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // Reduzir logs de desenvolvimento
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Desabilitar DevTools em desenvolvimento para evitar avisos de params
  experimental: {
    // Isso ajuda a evitar problemas com serialização de props no DevTools
  },
};

module.exports = nextConfig;
