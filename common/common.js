import pkg from 'roll-parser';
const { parse, roll } = pkg;

export function parseBonusFromArguments(args) {
	const lastArg = args.slice(-1)[0];
	let targetString = args.join(' ').toLowerCase();
	const parsedBonus = Number.parseInt(lastArg, 10);
	let bonus;
	if (!Number.isNaN(parsedBonus)) {
		bonus = parsedBonus;
		targetString = targetString.replace(lastArg, '').trim();
	}
	else {
		bonus = 0;
	}
	return { rest: targetString, bonus: bonus };
}

export function getQS(fp) {
	if (fp >= 16) return 6;
	if (fp >= 13) return 5;
	if (fp >= 10) return 4;
	if (fp >= 7) return 3;
	if (fp >= 4) return 2;
	if (fp >= 0) return 1;
	return 0;
}

export function sendMessage(message, opts, content) {
	if (opts.privateAnswerRequested === true) {message.author.send(content);}
	else {message.channel.send(content);}
}

export function wuerfelWerfen(wurfelArgs) {
	const parsedRoll = parse(wurfelArgs.replace('W', 'D').replace('w', 'd'));
	return roll(parsedRoll);
}

export function rollDice(max) {
	return Math.ceil(Math.random() * max);
}

export function wuerfelWerfenParsed(parsedRoll) {
	return roll(parsedRoll);
}

export function parseWuerfel(args) {
	const parsedRoll = parse(args.replace('W', 'D').replace('w', 'd'));
	return parsedRoll;
}