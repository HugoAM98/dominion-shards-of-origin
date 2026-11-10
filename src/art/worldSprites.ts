import type { FactionId } from '../data/types';
import type { Grid } from './pixel';

export const PLAYER_CRYSTAL: Grid = [
  '.....o.....',
  '....ono....',
  '....ono....',
  '...onnno...',
  '...mnonm...',
  '..mnnonnm..',
  '..lmnoonml.',
  '.lmnnoonnml',
  '.lmnnnonnml',
  '..lmnnnnml.',
  '...lmnnml..',
  '....lmml...',
  '.....ll....',
];

// Observatory spire. The crystal floats between the two gold prongs (rows 0-6).
export const PLAYER_TOWER: Grid = [
  '..z...................z..',
  '..zz.................zZ..',
  '...zz...............zZ...',
  '...fz...............zZ...',
  '....zz.............zZ....',
  '....fzz...........zzZ....',
  '.....fzzzzzzzzzzzzzZ.....',
  '......ZZzzzzzzzzzZZ......',
  '........677777774........',
  '........677777764........',
  '........6777nn764........',
  '........6777nm764........',
  '........6777mm764........',
  '........677777764........',
  '.......zzzzzzzzzzz.......',
  '.......67777777764.......',
  '.......67777777764.......',
  '.......6777nnnn764.......',
  '.......677nooonn64.......',
  '.......677nnnnmm64.......',
  '.......6777mmmm764.......',
  '.......67777777764.......',
  '......zzzzzzzzzzzzz......',
  '......6777777777764......',
  '......6777766667764......',
  '......6777633336764......',
  '......677763kk36764......',
  '......677763kl36764......',
  '......677763kl36764......',
  '.....zzzzzzzzzzzzzzz.....',
  '....67777777777777764....',
  '...5555555555555555555...',
  '..444444444444444444444..',
];

export const ENEMY_CITADEL: Grid = [
  '...q.......q.......q....',
  '...r.......r.......r....',
  '..qrq.....qsq.....qrq...',
  '..qrq....qrsrq....qrq...',
  '.qrrrq...qrsrq...qrrrq..',
  '.qrsrqqqqrrrrrqqqqrsrq..',
  '.qrrrrrrrrrrrrrrrrrrrq..',
  '.pqqqqqqqqqqqqqqqqqqqp..',
  '..pqrrrrrrrrrrrrrrrqp...',
  '..pqrrrrrppppprrrrrqp...',
  '..pqrrrrppSSSpprrrrqp...',
  '..pqrrrrpSS7SSprrrrqp...',
  '..pqrrrrppSSSpprrrrqp...',
  '..pqrrrrrppppprrrrrqp...',
  '..pqrrsrrrrrrrrrsrrqp...',
  '..pqrrsrrrrrrrrrsrrqp...',
  '..pqqqqqqqqqqqqqqqqqp...',
  '.pqrrrrrrrrrrrrrrrrrqp..',
  '.pqrrsrrrpppppprrsrrqp..',
  '.pqrrrrrp111111prrrrqp..',
  '.pqrrrrrp111111prrrrqp..',
  '.pqrrrrrp111111prrrrqp..',
  'ppqqqqqqp111111pqqqqqpp.',
  'pppppppppppppppppppppppp',
];

/** Maps the citadel's violet ramp (p,q,r,s,S) onto each faction's ramp. */
export const FACTION_SWAP: Record<FactionId, Record<string, string>> = {
  necrovan: {},
  infernia: { p: 'a', q: 'b', r: 'c', s: 'd', S: 'e' },
  xenthar: { p: 'g', q: 'h', r: 'i', s: 'j', S: 'J' },
  thalassia: { p: 'K', q: 'L', r: 'M', s: 'N', S: 'O' },
  mekanor: { p: 't', q: 'u', r: 'v', s: 'w', S: 'n' },
  astralis: { p: 'k', q: 'l', r: 'm', s: 'n', S: 'f' },
};

export const FX: Record<string, Grid[]> = {
  spark: [
    ['.......', '...7...', '..777..', '.77777.', '..777..', '...7...', '.......'],
    ['...7...', '.7...7.', '...7...', '7.777.7', '...7...', '.7...7.', '...7...'],
    ['.......', '.7...7.', '.......', '7.....7', '.......', '.7...7.', '.......'],
  ],
  puff: [
    ['.........', '.........', '...66....', '..6776...', '..67765..', '...6655..', '.........', '.........', '.........'],
    ['.........', '..66.6...', '.677666..', '.6777765.', '.6677765.', '..566655.', '...555...', '.........', '.........'],
    ['..6...6..', '.676.6.6.', '6776..65.', '.66...5..', '.....655.', '.6...5565', '.565..55.', '..5......', '.........'],
    ['.6.....6.', '.........', '6.......5', '.........', '.........', '.........', '5.......5', '.........', '..5...5..'],
  ],
  dust: [
    ['.........', '.........', '.........', '..6...6..', '.565.565.'],
    ['.........', '.........', '.6.....6.', '565...565', '.5.....5.'],
    ['.........', '6.......6', '.........', '5.......5', '.........'],
  ],
  portal: [
    ['..mm..', '.m..m.', 'm....m', 'm....m', 'm....m', 'm....m', 'm....m', '.m..m.', '..mm..'],
    ['..nn..', '.nmmn.', 'nm..mn', 'n....n', 'n....n', 'n....n', 'nm..mn', '.nmmn.', '..nn..'],
    ['..oo..', '.onno.', 'on77no', 'o7..7o', 'o7..7o', 'o7..7o', 'on77no', '.onno.', '..oo..'],
  ],
  boom: [
    ['.............', '.............', '.............', '.....eee.....', '....eEEEe....', '...eEEEEEe...', '...eEE7EEe...', '...eEEEEEe...', '....eEEEe....', '.....eee.....', '.............', '.............', '.............'],
    ['.............', '....d.e.d....', '...deeEeed...', '..deEEEEEed..', '.deEEE7EEEed.', '.eEE77777EEe.', '.eEE77777EEe.', '.deEEE7EEEed.', '..deEEEEEed..', '...deeEeed...', '....d.e.d....', '.............', '.............'],
    ['....c...c....', '..c.d.d.d.c..', '.cd.......dc.', '..d..ddd..d..', 'c...dd.dd...c', '.d.d.....d.d.', '...d.....d...', '.d.d.....d.d.', 'c...dd.dd...c', '..d..ddd..d..', '.cd.......dc.', '..c.d.d.d.c..', '....c...c....'],
  ],
  meteor: [
    ['....eE.', '..deEEe', '.deEEEe', 'dceEEe.', 'bcde...', 'bc.....', 'b......'],
  ],
  heal: [
    ['..G..', '..G..', 'GGGGG', '..G..', '..G..'],
  ],
};

export const PROJECTILES: Record<string, Grid> = {
  light: ['.o.', 'o7o', '.o.'],
  ember: ['..e.', 'deEe', '..e.'],
  water: ['.N.', 'NOO', '.N.'],
  soul: ['.s.', 'sSs', '.s.'],
};

export const DIGITS: Record<string, Grid> = {
  '0': ['777', '7.7', '7.7', '7.7', '777'],
  '1': ['.7.', '77.', '.7.', '.7.', '777'],
  '2': ['777', '..7', '777', '7..', '777'],
  '3': ['777', '..7', '.77', '..7', '777'],
  '4': ['7.7', '7.7', '777', '..7', '..7'],
  '5': ['777', '7..', '777', '..7', '777'],
  '6': ['777', '7..', '777', '7.7', '777'],
  '7': ['777', '..7', '.7.', '.7.', '.7.'],
  '8': ['777', '7.7', '777', '7.7', '777'],
  '9': ['777', '7.7', '777', '..7', '777'],
  '+': ['...', '.7.', '777', '.7.', '...'],
};

export const ICONS: Record<string, Grid> = {
  energy: ['...n...', '..nno..', '.mnno..', 'lmnnoo.', '.lmnn..', '..lmn..', '...l...'],
  dust: ['...f.....', '..fzf....', '...f..f..', '......z..', '..zzz....', '.zffzz.f.', 'Zzzzzzz..'],
  fragment: ['....o..', '...no..', '..mnno.', '.lmnoo.', '.lmnn..', '..lm...', '...l...'],
  sword: ['......77', '.....767', '....767.', '.z.767..', '..z67...', '..Zz....', '.Z..z...', 'Z.......'],
  tower: ['...z...', '..5z5..', '..676..', '..6n6..', '..676..', '.56765.', '.6n7n6.', '5677765'],
  portal: ['..rrr..', '.rsSsr.', 'rs...sr', 'rS.7.Sr', 'rs...sr', '.rsSsr.', '..rrr..'],
  book: ['.qqqqq.', 'qx7xx7q', 'qxyxxyq', 'qxyxxyq', 'qxyxxyq', 'qx7xx7q', '.qqqqq.'],
  evolve: ['...G...', '..GGG..', '.GG7GG.', '...G...', '..jGj..', '..jGj..', '..iii..'],
  gear: ['..5.5..', '.56665.', '5671765', '.67.76.', '5671765', '.56665.', '..5.5..'],
  lock: ['..555..', '.5...5.', '.5...5.', 'zzzzzzz', 'zfz1zfz', 'zzz1zzz', 'ZZZZZZZ'],
  star: ['...f...', '...z...', 'fzzzzzf', '.zzzzz.', '..z.z..', '.z...z.'],
  skull: ['.xxxx.', 'xxxxxx', 'x11x11', 'xxx7xx', '.yxyx.', '.y.y..'],
  map: ['zzzzzzz', 'zf.ff.z', 'z.R..fz', 'zf.f..z', 'z..ffRz', 'zf....z', 'zzzzzzz'],
  heart: ['.cc.cc.', 'cddcddc', 'cdeddde', 'cdddddc', '.cdddc.', '..cdc..', '...c...'],
};
