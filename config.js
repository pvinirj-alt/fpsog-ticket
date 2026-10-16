// Configurações gerais do sistema de tickets.
// Edite aqui os textos, categorias e cores sem mexer no resto do código.

module.exports = {
  colors: {
    embed: 0x010101, // cor da barra lateral do embed (preto — 0x000000 puro é tratado pelo Discord como "sem cor")
  },

  panel: {
    title: 'Sistema de Tickets',
    description: '— Selecione uma categoria abaixo para continuar.',
    rules: [
      'Escolha a opção que melhor corresponde à sua necessidade.',
      'Antes de abrir um atendimento, confira a categoria correta.',
      'Evite abrir múltiplos tickets para o mesmo assunto.',
    ],
    schedule: {
      title: 'Horário de Atendimento',
      lines: [
        'Atendimento 24 horas, todos os dias',
        'Horário de Brasília',
      ],
    },
    important: {
      title: 'Importante',
      lines: [
        'Explique sua solicitação de forma clara e objetiva.',
        'Respeite a equipe durante o atendimento.',
        'Spam ou mensagens ofensivas poderão resultar em penalidades.',
      ],
    },
    selectPlaceholder: 'Clique aqui para ver as opções',
  },

  // Categorias do menu dropdown. "value" precisa ser único (usado no custom_id do canal).
  categories: [
    {
      value: 'suporte',
      label: 'Suporte',
      description: 'Dúvidas gerais e suporte técnico',
    },
    {
      value: 'parceria',
      label: 'Parceria',
      description: 'Propostas de parceria',
    },
    {
      value: 'bugs',
      label: 'Bugs',
      description: 'Reportar bugs e problemas',
    },
  ],

  // Mensagem enviada dentro do canal do ticket ao ser criado
  ticketOpenedMessage: (user, category) =>
    `Olá <@${user.id}>, seu ticket de **${category.label}** foi aberto.\n` +
    `Descreva sua solicitação com o máximo de detalhes possível. A equipe responderá em breve.`,
};
