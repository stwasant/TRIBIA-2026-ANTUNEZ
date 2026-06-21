// ============================================================
// DATOS COMPLETOS - MUNDIAL 2026
// Actualizado al 20 de junio 2026
// ============================================================

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export const PHASES = {
  group: 'Fase de Grupos',
  r32: 'Ronda de 32',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  third: 'Tercer Lugar',
  final: 'Final',
};

// ---------------------------
// FASE DE GRUPOS (72 partidos)
// ---------------------------
const groupMatches = [
  // ======== GRUPO A ========
  { id:'A1', group:'A', matchday:1, home:'México', away:'Sudáfrica', homeFlag:'🇲🇽', awayFlag:'🇿🇦', date:'2026-06-11', time:'21:00', stadium:'Estadio Azteca', city:'Ciudad de México', homeScore:2, awayScore:0, status:'finished' },
  { id:'A2', group:'A', matchday:1, home:'Corea del Sur', away:'República Checa', homeFlag:'🇰🇷', awayFlag:'🇨🇿', date:'2026-06-11', time:'18:00', stadium:'SoFi Stadium', city:'Los Ángeles', homeScore:2, awayScore:1, status:'finished' },
  { id:'A3', group:'A', matchday:2, home:'México', away:'Corea del Sur', homeFlag:'🇲🇽', awayFlag:'🇰🇷', date:'2026-06-18', time:'21:00', stadium:'Estadio Azteca', city:'Ciudad de México', homeScore:1, awayScore:0, status:'finished' },
  { id:'A4', group:'A', matchday:2, home:'República Checa', away:'Sudáfrica', homeFlag:'🇨🇿', awayFlag:'🇿🇦', date:'2026-06-18', time:'18:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:1, awayScore:1, status:'finished' },
  { id:'A5', group:'A', matchday:3, home:'Sudáfrica', away:'México', homeFlag:'🇿🇦', awayFlag:'🇲🇽', date:'2026-06-24', time:'20:00', stadium:'Estadio Azteca', city:'Ciudad de México', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'A6', group:'A', matchday:3, home:'Corea del Sur', away:'República Checa', homeFlag:'🇰🇷', awayFlag:'🇨🇿', date:'2026-06-24', time:'20:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO B ========
  { id:'B1', group:'B', matchday:1, home:'Canadá', away:'Bosnia y Herzegovina', homeFlag:'🇨🇦', awayFlag:'🇧🇦', date:'2026-06-12', time:'21:00', stadium:'BMO Field', city:'Toronto', homeScore:1, awayScore:1, status:'finished' },
  { id:'B2', group:'B', matchday:1, home:'Suiza', away:'Qatar', homeFlag:'🇨🇭', awayFlag:'🇶🇦', date:'2026-06-12', time:'18:00', stadium:'Levi\'s Stadium', city:'San Francisco', homeScore:1, awayScore:1, status:'finished' },
  { id:'B3', group:'B', matchday:2, home:'Canadá', away:'Qatar', homeFlag:'🇨🇦', awayFlag:'🇶🇦', date:'2026-06-18', time:'18:00', stadium:'BMO Field', city:'Toronto', homeScore:6, awayScore:0, status:'finished' },
  { id:'B4', group:'B', matchday:2, home:'Suiza', away:'Bosnia y Herzegovina', homeFlag:'🇨🇭', awayFlag:'🇧🇦', date:'2026-06-18', time:'21:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:4, awayScore:1, status:'finished' },
  { id:'B5', group:'B', matchday:3, home:'Qatar', away:'Suiza', homeFlag:'🇶🇦', awayFlag:'🇨🇭', date:'2026-06-24', time:'20:00', stadium:'Levi\'s Stadium', city:'San Francisco', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'B6', group:'B', matchday:3, home:'Bosnia y Herzegovina', away:'Canadá', homeFlag:'🇧🇦', awayFlag:'🇨🇦', date:'2026-06-24', time:'20:00', stadium:'BMO Field', city:'Toronto', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO C ========
  { id:'C1', group:'C', matchday:1, home:'Brasil', away:'Marruecos', homeFlag:'🇧🇷', awayFlag:'🇲🇦', date:'2026-06-13', time:'21:00', stadium:'SoFi Stadium', city:'Los Ángeles', homeScore:1, awayScore:1, status:'finished' },
  { id:'C2', group:'C', matchday:1, home:'Escocia', away:'Haití', homeFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', awayFlag:'🇭🇹', date:'2026-06-13', time:'18:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:1, awayScore:0, status:'finished' },
  { id:'C3', group:'C', matchday:2, home:'Marruecos', away:'Escocia', homeFlag:'🇲🇦', awayFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', date:'2026-06-19', time:'21:00', stadium:'Hard Rock Stadium', city:'Miami', homeScore:1, awayScore:0, status:'finished' },
  { id:'C4', group:'C', matchday:2, home:'Brasil', away:'Haití', homeFlag:'🇧🇷', awayFlag:'🇭🇹', date:'2026-06-19', time:'18:00', stadium:'SoFi Stadium', city:'Los Ángeles', homeScore:3, awayScore:0, status:'finished' },
  { id:'C5', group:'C', matchday:3, home:'Haití', away:'Brasil', homeFlag:'🇭🇹', awayFlag:'🇧🇷', date:'2026-06-25', time:'20:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'C6', group:'C', matchday:3, home:'Escocia', away:'Marruecos', homeFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', awayFlag:'🇲🇦', date:'2026-06-25', time:'20:00', stadium:'Hard Rock Stadium', city:'Miami', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO D ========
  { id:'D1', group:'D', matchday:1, home:'Estados Unidos', away:'Paraguay', homeFlag:'🇺🇸', awayFlag:'🇵🇾', date:'2026-06-12', time:'21:00', stadium:'SoFi Stadium', city:'Los Ángeles', homeScore:4, awayScore:1, status:'finished' },
  { id:'D2', group:'D', matchday:1, home:'Australia', away:'Turquía', homeFlag:'🇦🇺', awayFlag:'🇹🇷', date:'2026-06-12', time:'15:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:2, awayScore:0, status:'finished' },
  { id:'D3', group:'D', matchday:2, home:'Estados Unidos', away:'Australia', homeFlag:'🇺🇸', awayFlag:'🇦🇺', date:'2026-06-19', time:'21:00', stadium:'SoFi Stadium', city:'Los Ángeles', homeScore:2, awayScore:0, status:'finished' },
  { id:'D4', group:'D', matchday:2, home:'Paraguay', away:'Turquía', homeFlag:'🇵🇾', awayFlag:'🇹🇷', date:'2026-06-19', time:'18:00', stadium:'Arrowhead Stadium', city:'Kansas City', homeScore:1, awayScore:0, status:'finished' },
  { id:'D5', group:'D', matchday:3, home:'Turquía', away:'Estados Unidos', homeFlag:'🇹🇷', awayFlag:'🇺🇸', date:'2026-06-25', time:'20:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'D6', group:'D', matchday:3, home:'Paraguay', away:'Australia', homeFlag:'🇵🇾', awayFlag:'🇦🇺', date:'2026-06-25', time:'20:00', stadium:'Arrowhead Stadium', city:'Kansas City', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO E ========
  { id:'E1', group:'E', matchday:1, home:'Alemania', away:'Curazao', homeFlag:'🇩🇪', awayFlag:'🇨🇼', date:'2026-06-14', time:'21:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:7, awayScore:1, status:'finished' },
  { id:'E2', group:'E', matchday:1, home:'Costa de Marfil', away:'Ecuador', homeFlag:'🇨🇮', awayFlag:'🇪🇨', date:'2026-06-14', time:'18:00', stadium:'NRG Stadium', city:'Houston', homeScore:1, awayScore:0, status:'finished' },
  { id:'E3', group:'E', matchday:2, home:'Alemania', away:'Costa de Marfil', homeFlag:'🇩🇪', awayFlag:'🇨🇮', date:'2026-06-20', time:'21:00', stadium:'Levi\'s Stadium', city:'San Francisco', homeScore:null, awayScore:null, status:'live' },
  { id:'E4', group:'E', matchday:2, home:'Ecuador', away:'Curazao', homeFlag:'🇪🇨', awayFlag:'🇨🇼', date:'2026-06-20', time:'18:00', stadium:'NRG Stadium', city:'Houston', homeScore:null, awayScore:null, status:'live' },
  { id:'E5', group:'E', matchday:3, home:'Curazao', away:'Costa de Marfil', homeFlag:'🇨🇼', awayFlag:'🇨🇮', date:'2026-06-26', time:'20:00', stadium:'NRG Stadium', city:'Houston', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'E6', group:'E', matchday:3, home:'Ecuador', away:'Alemania', homeFlag:'🇪🇨', awayFlag:'🇩🇪', date:'2026-06-26', time:'20:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO F ========
  { id:'F1', group:'F', matchday:1, home:'Países Bajos', away:'Japón', homeFlag:'🇳🇱', awayFlag:'🇯🇵', date:'2026-06-15', time:'21:00', stadium:'Estadio Akron', city:'Guadalajara', homeScore:2, awayScore:2, status:'finished' },
  { id:'F2', group:'F', matchday:1, home:'Suecia', away:'Túnez', homeFlag:'🇸🇪', awayFlag:'🇹🇳', date:'2026-06-15', time:'18:00', stadium:'Estadio BBVA', city:'Monterrey', homeScore:5, awayScore:1, status:'finished' },
  { id:'F3', group:'F', matchday:2, home:'Países Bajos', away:'Suecia', homeFlag:'🇳🇱', awayFlag:'🇸🇪', date:'2026-06-20', time:'21:00', stadium:'Estadio Akron', city:'Guadalajara', homeScore:5, awayScore:1, status:'finished' },
  { id:'F4', group:'F', matchday:2, home:'Japón', away:'Túnez', homeFlag:'🇯🇵', awayFlag:'🇹🇳', date:'2026-06-20', time:'18:00', stadium:'Estadio BBVA', city:'Monterrey', homeScore:null, awayScore:null, status:'live' },
  { id:'F5', group:'F', matchday:3, home:'Túnez', away:'Países Bajos', homeFlag:'🇹🇳', awayFlag:'🇳🇱', date:'2026-06-26', time:'20:00', stadium:'Estadio Akron', city:'Guadalajara', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'F6', group:'F', matchday:3, home:'Japón', away:'Suecia', homeFlag:'🇯🇵', awayFlag:'🇸🇪', date:'2026-06-26', time:'20:00', stadium:'Estadio BBVA', city:'Monterrey', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO G ========
  { id:'G1', group:'G', matchday:1, home:'Bélgica', away:'Egipto', homeFlag:'🇧🇪', awayFlag:'🇪🇬', date:'2026-06-15', time:'21:00', stadium:'Lincoln Financial Field', city:'Filadelfia', homeScore:1, awayScore:1, status:'finished' },
  { id:'G2', group:'G', matchday:1, home:'Irán', away:'Nueva Zelanda', homeFlag:'🇮🇷', awayFlag:'🇳🇿', date:'2026-06-15', time:'18:00', stadium:'Estadio Akron', city:'Guadalajara', homeScore:2, awayScore:2, status:'finished' },
  { id:'G3', group:'G', matchday:2, home:'Bélgica', away:'Irán', homeFlag:'🇧🇪', awayFlag:'🇮🇷', date:'2026-06-21', time:'21:00', stadium:'Mercedes-Benz Stadium', city:'Atlanta', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'G4', group:'G', matchday:2, home:'Egipto', away:'Nueva Zelanda', homeFlag:'🇪🇬', awayFlag:'🇳🇿', date:'2026-06-21', time:'18:00', stadium:'Lincoln Financial Field', city:'Filadelfia', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'G5', group:'G', matchday:3, home:'Nueva Zelanda', away:'Bélgica', homeFlag:'🇳🇿', awayFlag:'🇧🇪', date:'2026-06-27', time:'20:00', stadium:'Lumen Field', city:'Seattle', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'G6', group:'G', matchday:3, home:'Irán', away:'Egipto', homeFlag:'🇮🇷', awayFlag:'🇪🇬', date:'2026-06-27', time:'20:00', stadium:'Mercedes-Benz Stadium', city:'Atlanta', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO H ========
  { id:'H1', group:'H', matchday:1, home:'España', away:'Cabo Verde', homeFlag:'🇪🇸', awayFlag:'🇨🇻', date:'2026-06-15', time:'15:00', stadium:'Hard Rock Stadium', city:'Miami', homeScore:0, awayScore:0, status:'finished' },
  { id:'H2', group:'H', matchday:1, home:'Arabia Saudita', away:'Uruguay', homeFlag:'🇸🇦', awayFlag:'🇺🇾', date:'2026-06-15', time:'12:00', stadium:'NRG Stadium', city:'Houston', homeScore:1, awayScore:1, status:'finished' },
  { id:'H3', group:'H', matchday:2, home:'España', away:'Uruguay', homeFlag:'🇪🇸', awayFlag:'🇺🇾', date:'2026-06-21', time:'21:00', stadium:'Hard Rock Stadium', city:'Miami', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'H4', group:'H', matchday:2, home:'Cabo Verde', away:'Arabia Saudita', homeFlag:'🇨🇻', awayFlag:'🇸🇦', date:'2026-06-21', time:'18:00', stadium:'Arrowhead Stadium', city:'Kansas City', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'H5', group:'H', matchday:3, home:'Arabia Saudita', away:'España', homeFlag:'🇸🇦', awayFlag:'🇪🇸', date:'2026-06-27', time:'20:00', stadium:'NRG Stadium', city:'Houston', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'H6', group:'H', matchday:3, home:'Uruguay', away:'Cabo Verde', homeFlag:'🇺🇾', awayFlag:'🇨🇻', date:'2026-06-27', time:'20:00', stadium:'Arrowhead Stadium', city:'Kansas City', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO I ========
  { id:'I1', group:'I', matchday:1, home:'Francia', away:'Senegal', homeFlag:'🇫🇷', awayFlag:'🇸🇳', date:'2026-06-16', time:'21:00', stadium:'Mercedes-Benz Stadium', city:'Atlanta', homeScore:3, awayScore:1, status:'finished' },
  { id:'I2', group:'I', matchday:1, home:'Noruega', away:'Iraq', homeFlag:'🇳🇴', awayFlag:'🇮🇶', date:'2026-06-16', time:'18:00', stadium:'Lumen Field', city:'Seattle', homeScore:4, awayScore:1, status:'finished' },
  { id:'I3', group:'I', matchday:2, home:'Francia', away:'Noruega', homeFlag:'🇫🇷', awayFlag:'🇳🇴', date:'2026-06-22', time:'21:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'I4', group:'I', matchday:2, home:'Senegal', away:'Iraq', homeFlag:'🇸🇳', awayFlag:'🇮🇶', date:'2026-06-22', time:'18:00', stadium:'Gillette Stadium', city:'Boston', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'I5', group:'I', matchday:3, home:'Iraq', away:'Francia', homeFlag:'🇮🇶', awayFlag:'🇫🇷', date:'2026-06-27', time:'20:00', stadium:'Lumen Field', city:'Seattle', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'I6', group:'I', matchday:3, home:'Senegal', away:'Noruega', homeFlag:'🇸🇳', awayFlag:'🇳🇴', date:'2026-06-27', time:'20:00', stadium:'Mercedes-Benz Stadium', city:'Atlanta', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO J ========
  { id:'J1', group:'J', matchday:1, home:'Argentina', away:'Argelia', homeFlag:'🇦🇷', awayFlag:'🇩🇿', date:'2026-06-16', time:'21:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:3, awayScore:0, status:'finished' },
  { id:'J2', group:'J', matchday:1, home:'Austria', away:'Jordania', homeFlag:'🇦🇹', awayFlag:'🇯🇴', date:'2026-06-16', time:'18:00', stadium:'Gillette Stadium', city:'Boston', homeScore:3, awayScore:1, status:'finished' },
  { id:'J3', group:'J', matchday:2, home:'Argentina', away:'Austria', homeFlag:'🇦🇷', awayFlag:'🇦🇹', date:'2026-06-22', time:'21:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'J4', group:'J', matchday:2, home:'Argelia', away:'Jordania', homeFlag:'🇩🇿', awayFlag:'🇯🇴', date:'2026-06-22', time:'18:00', stadium:'Lincoln Financial Field', city:'Filadelfia', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'J5', group:'J', matchday:3, home:'Jordania', away:'Argentina', homeFlag:'🇯🇴', awayFlag:'🇦🇷', date:'2026-06-27', time:'20:00', stadium:'Gillette Stadium', city:'Boston', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'J6', group:'J', matchday:3, home:'Argelia', away:'Austria', homeFlag:'🇩🇿', awayFlag:'🇦🇹', date:'2026-06-27', time:'20:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO K ========
  { id:'K1', group:'K', matchday:1, home:'Portugal', away:'Congo RD', homeFlag:'🇵🇹', awayFlag:'🇨🇩', date:'2026-06-17', time:'21:00', stadium:'Estadio Azteca', city:'Ciudad de México', homeScore:1, awayScore:1, status:'finished' },
  { id:'K2', group:'K', matchday:1, home:'Colombia', away:'Uzbekistán', homeFlag:'🇨🇴', awayFlag:'🇺🇿', date:'2026-06-17', time:'18:00', stadium:'Levi\'s Stadium', city:'San Francisco', homeScore:3, awayScore:1, status:'finished' },
  { id:'K3', group:'K', matchday:2, home:'Portugal', away:'Colombia', homeFlag:'🇵🇹', awayFlag:'🇨🇴', date:'2026-06-23', time:'21:00', stadium:'Hard Rock Stadium', city:'Miami', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'K4', group:'K', matchday:2, home:'Congo RD', away:'Uzbekistán', homeFlag:'🇨🇩', awayFlag:'🇺🇿', date:'2026-06-23', time:'18:00', stadium:'Estadio Azteca', city:'Ciudad de México', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'K5', group:'K', matchday:3, home:'Uzbekistán', away:'Portugal', homeFlag:'🇺🇿', awayFlag:'🇵🇹', date:'2026-06-27', time:'20:00', stadium:'Levi\'s Stadium', city:'San Francisco', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'K6', group:'K', matchday:3, home:'Congo RD', away:'Colombia', homeFlag:'🇨🇩', awayFlag:'🇨🇴', date:'2026-06-27', time:'20:00', stadium:'Lincoln Financial Field', city:'Filadelfia', homeScore:null, awayScore:null, status:'scheduled' },

  // ======== GRUPO L ========
  { id:'L1', group:'L', matchday:1, home:'Inglaterra', away:'Croacia', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', awayFlag:'🇭🇷', date:'2026-06-17', time:'21:00', stadium:'Gillette Stadium', city:'Boston', homeScore:4, awayScore:2, status:'finished' },
  { id:'L2', group:'L', matchday:1, home:'Ghana', away:'Panamá', homeFlag:'🇬🇭', awayFlag:'🇵🇦', date:'2026-06-17', time:'18:00', stadium:'Lincoln Financial Field', city:'Filadelfia', homeScore:1, awayScore:0, status:'finished' },
  { id:'L3', group:'L', matchday:2, home:'Inglaterra', away:'Ghana', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', awayFlag:'🇬🇭', date:'2026-06-23', time:'21:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'L4', group:'L', matchday:2, home:'Croacia', away:'Panamá', homeFlag:'🇭🇷', awayFlag:'🇵🇦', date:'2026-06-23', time:'18:00', stadium:'Gillette Stadium', city:'Boston', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'L5', group:'L', matchday:3, home:'Panamá', away:'Inglaterra', homeFlag:'🇵🇦', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-06-27', time:'20:00', stadium:'Arrowhead Stadium', city:'Kansas City', homeScore:null, awayScore:null, status:'scheduled' },
  { id:'L6', group:'L', matchday:3, home:'Ghana', away:'Croacia', homeFlag:'🇬🇭', awayFlag:'🇭🇷', date:'2026-06-27', time:'20:00', stadium:'Mercedes-Benz Stadium', city:'Atlanta', homeScore:null, awayScore:null, status:'scheduled' },
];

// ----------------------------------------
// RONDA DE 32 (16 partidos - por definir)
// ----------------------------------------
const r32Matches = Array.from({ length: 16 }, (_, i) => ({
  id: `R32-${i + 1}`,
  group: null,
  matchday: null,
  home: 'Por definir',
  away: 'Por definir',
  homeFlag: '🏳️',
  awayFlag: '🏳️',
  date: i < 4 ? '2026-06-28' : i < 8 ? '2026-06-29' : i < 12 ? '2026-07-01' : '2026-07-03',
  time: i % 2 === 0 ? '16:00' : '20:00',
  stadium: 'Por confirmar',
  city: 'Por confirmar',
  homeScore: null,
  awayScore: null,
  status: 'scheduled',
  phase: 'r32',
}));

// --------------------------------------------------
// OCTAVOS DE FINAL (8 partidos - por definir)
// --------------------------------------------------
const r16Matches = Array.from({ length: 8 }, (_, i) => ({
  id: `R16-${i + 1}`,
  group: null,
  matchday: null,
  home: 'Por definir',
  away: 'Por definir',
  homeFlag: '🏳️',
  awayFlag: '🏳️',
  date: i < 2 ? '2026-07-04' : i < 4 ? '2026-07-05' : i < 6 ? '2026-07-06' : '2026-07-07',
  time: i % 2 === 0 ? '16:00' : '20:00',
  stadium: 'Por confirmar',
  city: 'Por confirmar',
  homeScore: null,
  awayScore: null,
  status: 'scheduled',
  phase: 'r16',
}));

// ----------------------------------------
// CUARTOS DE FINAL (4 partidos)
// ----------------------------------------
const qfMatches = Array.from({ length: 4 }, (_, i) => ({
  id: `QF-${i + 1}`,
  group: null,
  matchday: null,
  home: 'Por definir',
  away: 'Por definir',
  homeFlag: '🏳️',
  awayFlag: '🏳️',
  date: i < 2 ? '2026-07-09' : i < 3 ? '2026-07-10' : '2026-07-11',
  time: i % 2 === 0 ? '16:00' : '20:00',
  stadium: 'Por confirmar',
  city: 'Por confirmar',
  homeScore: null,
  awayScore: null,
  status: 'scheduled',
  phase: 'qf',
}));

// ----------------------------------------
// SEMIFINALES (2 partidos)
// ----------------------------------------
const sfMatches = [
  { id:'SF-1', group:null, matchday:null, home:'Por definir', away:'Por definir', homeFlag:'🏳️', awayFlag:'🏳️', date:'2026-07-14', time:'20:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:null, awayScore:null, status:'scheduled', phase:'sf' },
  { id:'SF-2', group:null, matchday:null, home:'Por definir', away:'Por definir', homeFlag:'🏳️', awayFlag:'🏳️', date:'2026-07-15', time:'20:00', stadium:'AT&T Stadium', city:'Dallas', homeScore:null, awayScore:null, status:'scheduled', phase:'sf' },
];

// ----------------------------------------
// TERCER LUGAR
// ----------------------------------------
const thirdMatch = [
  { id:'3RD', group:null, matchday:null, home:'Por definir', away:'Por definir', homeFlag:'🏳️', awayFlag:'🏳️', date:'2026-07-18', time:'17:00', stadium:'Hard Rock Stadium', city:'Miami', homeScore:null, awayScore:null, status:'scheduled', phase:'third' },
];

// ----------------------------------------
// FINAL
// ----------------------------------------
const finalMatch = [
  { id:'FINAL', group:null, matchday:null, home:'Por definir', away:'Por definir', homeFlag:'🏳️', awayFlag:'🏳️', date:'2026-07-19', time:'20:00', stadium:'MetLife Stadium', city:'Nueva York', homeScore:null, awayScore:null, status:'scheduled', phase:'final' },
];

// Añadir phase a los partidos de grupos
const normalizedGroupMatches = groupMatches.map(m => ({ ...m, phase: 'group' }));

export const ALL_MATCHES = [
  ...normalizedGroupMatches,
  ...r32Matches,
  ...r16Matches,
  ...qfMatches,
  ...sfMatches,
  ...thirdMatch,
  ...finalMatch,
];
