// Utilitários para WhatsApp

export const sendWhatsAppMessage = (phone: string, message: string) => {
  if (!phone) return;
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Formata para URL do WhatsApp Web
  const formattedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${formattedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se não começar com código do país, assume Brasil (55)
  if (cleanPhone.length === 11 && cleanPhone.startsWith('55')) {
    return cleanPhone;
  }
  if (cleanPhone.length === 11) {
    return `55${cleanPhone}`;
  }
  if (cleanPhone.length === 10) {
    return `55${cleanPhone}`;
  }
  
  return cleanPhone;
};

export const createReservationMessage = (name: string, date: string, time: string, people: number): string => {
  return `Olá ${name}! 🎉

Sua reserva foi confirmada:
📅 Data: ${date}
⏰ Horário: ${time}
👥 Pessoas: ${people}

Estamos ansiosos para recebê-lo!

Adega e Lanchonete Premium`;
};

export const createOrderReadyMessage = (customerName: string, tableNumber: string): string => {
  return `Olá ${customerName}! 👨‍🍳

Seu pedido da ${tableNumber} está pronto para entrega!

Por favor, chame um garçom.

Obrigado! 🍽️`;
};
