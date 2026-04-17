import qs from './qualitaetsstufen.json' with { type: 'json' };
import fmod from './fertigkeitsmodifikatoren.json' with { type: 'json' };
import bet from './betäubung.json' with { type: 'json' };
import schmerz from './schmerz.json' with { type: 'json' };
import furcht from './furcht.json' with { type: 'json' };

const data = { qs, fmod, bet, schmerz, furcht };
export default data;