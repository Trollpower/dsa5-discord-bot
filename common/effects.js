import { nachteile as nachteileFunctions, vorteile as vorteileFunctions } from './vorteileNachteileFunctions.js';
import { sonderfertigkeiten as sonderfertigkeitenFunctions } from './sonderfertigkeitenFunctions.js';

const addFunc = [...nachteileFunctions, ...vorteileFunctions, ...sonderfertigkeitenFunctions];

const applyEffects = (effects, props, isMeister) => {
	effects.forEach(effect =>
		effect.some(e => {
			const applicable = e.isApplyable({ ...props, isMeister });
			if (applicable) {
				e.apply({ ...props, isMeister, applicable });
			}
		}),
	);
};

export const applyPre = (props) => {
	const { event, character, interaction } = props;
	const isMeister = interaction.isMeister();

	applyEffects(addFunc.map(n => n.pre), { character, event }, isMeister);
};

export const applyPost = (props) => {
	const { event, character, interaction } = props;
	const isMeister = interaction.isMeister();

	applyEffects(addFunc.map(n => n.post), { character, event }, isMeister);
};