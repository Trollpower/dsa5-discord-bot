import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import logger from './logger.js';

const DEFAULT_PROVIDER = 'ndjson';
const DEFAULT_NDJSON_FILE = path.join(path.resolve('storage'), 'event-history.ndjson');
const MAX_SERIALIZE_DEPTH = 12;

const isPlainObject = (value) => {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

const serializeValue = (value, seen, depth) => {
	if (value == null) {
		return value;
	}
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (typeof value === 'function') {
		return `[Function ${value.name || 'anonymous'}]`;
	}
	if (typeof value !== 'object') {
		return value;
	}
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
		};
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (depth >= MAX_SERIALIZE_DEPTH) {
		const ctor = value?.constructor?.name ?? 'Object';
		return `[MaxDepth:${ctor}]`;
	}
	if (seen.has(value)) {
		return '[Circular]';
	}
	seen.add(value);

	if (Array.isArray(value)) {
		return value.map(item => serializeValue(item, seen, depth + 1));
	}

	const keys = Object.keys(value);
	if (isPlainObject(value)) {
		const result = {};
		for (const key of keys) {
			result[key] = serializeValue(value[key], seen, depth + 1);
		}
		return result;
	}

	const typedResult = {
		__type: value?.constructor?.name ?? 'Object',
	};
	for (const key of keys) {
		typedResult[key] = serializeValue(value[key], seen, depth + 1);
	}
	return typedResult;
};

const BLOCKED_PAYLOAD_TYPES_DEFAULT = ['InteractionResponse'];

const hasBlockedType = (value, blocked) => {
	if (!value || typeof value !== 'object') {
		return false;
	}
	if (Array.isArray(value)) {
		return value.some(item => hasBlockedType(item, blocked));
	}
	if (typeof value.__type === 'string' && blocked.has(value.__type)) {
		return true;
	}
	return Object.values(value).some(v => hasBlockedType(v, blocked));
};

const createHistoryRecord = ({ events, interaction, characterName, traceId, fallbackEventName }) => ({
	id: randomUUID(),
	ts: new Date().toISOString(),
	guildId: interaction?.guildId ?? null,
	channelId: interaction?.channelId ?? null,
	userId: interaction?.user?.id ?? null,
	characterName: characterName ?? null,
	eventName: Array.isArray(events)
		? fallbackEventName ?? 'unknown'
		: events?.name ?? fallbackEventName ?? 'unknown',
	payload: events,
	traceId: traceId ?? null,
});

class NoopEventHistoryProvider {
	async appendEvents(_input) {
		void _input;
		return null;
	}

	readLastEvent(_input) {
		void _input;
		return null;
	}

	readRecentProbes(_input) {
		void _input;
		return [];
	}

	readTopProbes(_input) {
		void _input;
		return [];
	}

	readRecentKsf(_input) {
		void _input;
		return [];
	}

	readTopKsf(_input) {
		void _input;
		return [];
	}

	readRecentMixed(_input) {
		void _input;
		return [];
	}

	readTopMixed(_input) {
		void _input;
		return [];
	}

	countEvents(_characterName) {
		return 0;
	}

	listEvents(_characterName) {
		return [];
	}

	readProbeHistory(_input) {
		return [];
	}

	trimEvents(_keepLast) {
		return { before: 0, after: 0 };
	}
}

class NdjsonEventHistoryProvider {
	constructor(filePath, blockedPayloadTypes = BLOCKED_PAYLOAD_TYPES_DEFAULT) {
		this.filePath = filePath;
		this.blockedPayloadTypes = new Set(blockedPayloadTypes);
		const dir = path.dirname(this.filePath);
		fs.mkdirSync(dir, { recursive: true });
	}

	async appendEvents(input) {
		if (input?.events == null) {
			return;
		}
		const record = createHistoryRecord(input);
		const plain = serializeValue(record, new WeakSet(), 0);
		if (hasBlockedType(plain?.payload, this.blockedPayloadTypes)) {
			logger.debug('event-history.append.blocked', {
				eventName: plain?.eventName,
				characterName: plain?.characterName,
			});
			return;
		}
		const line = `${JSON.stringify(plain)}\n`;
		fs.appendFileSync(this.filePath, line, 'utf8');
	}

	readLastEvent({ characterName, ignoreEventNames = [] }) {
		if (!fs.existsSync(this.filePath)) {
			return null;
		}
		const ignoreSet = new Set(ignoreEventNames.map(name => String(name).toLowerCase()));
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		for (let i = lines.length - 1; i >= 0; i--) {
			let record;
			try {
				record = JSON.parse(lines[i]);
			}
			catch {
				continue;
			}
			if (record.characterName !== characterName) continue;
			if (ignoreSet.has(String(record.eventName ?? '').toLowerCase())) continue;
			return record;
		}
		return null;
	}

	readRecentProbes({ characterName, count }) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const seen = new Set();
		const result = [];
		for (let i = lines.length - 1; i >= 0 && result.length < count; i--) {
			let record;
			try {
				record = JSON.parse(lines[i]);
			}
			catch {
				continue;
			}
			if (record.characterName !== characterName) continue;
			if (record.eventName !== 'probe') continue;
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			const fertigkeit = payload?.fertigkeit;
			if (!fertigkeit?.name || !fertigkeit?.kategorie) continue;
			const bonusMalus = payload?.bonusMalus ?? 0;
			const key = `${fertigkeit.kategorie}|${fertigkeit.name}|${bonusMalus}`;
			if (seen.has(key)) continue;
			seen.add(key);
			result.push({ name: fertigkeit.name, category: fertigkeit.kategorie, bonusMalus });
		}
		return result;
	}

	readProbeHistory({ characterName, count = 50 }) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const result = [];
		for (let i = lines.length - 1; i >= 0 && result.length < count; i--) {
			let record;
			try {
				record = JSON.parse(lines[i]);
			}
			catch {
				continue;
			}
			if (characterName && record.characterName !== characterName) continue;
			if (record.eventName !== 'probe') continue;
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			const fertigkeit = payload?.fertigkeit;
			if (!fertigkeit?.name) continue;
			result.push({
				ts: record.ts,
				name: fertigkeit.name,
				characterName: record.characterName,
				bestanden: payload?.bestanden ?? false,
				kritischBestanden: payload?.kritischBestanden ?? false,
				kritischFehlschlag: payload?.kritischFehlschlag ?? false,
				bonusMalus: payload?.bonusMalus ?? 0,
				fw: payload?.fw ?? null,
			});
		}
		return result;
	}

	countEvents(characterName) {
		if (!fs.existsSync(this.filePath)) {
			return 0;
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		if (!characterName) {
			return lines.length;
		}
		const nameLower = characterName.toLowerCase();
		return lines.filter(line => {
			try {
				const record = JSON.parse(line);
				return String(record.characterName ?? '').toLowerCase() === nameLower;
			}
			catch {
				return false;
			}
		}).length;
	}

	listEvents(characterName) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const nameLower = characterName ? characterName.toLowerCase() : null;
		const counts = new Map();
		for (const line of lines) {
			let record;
			try {
				record = JSON.parse(line);
			}
			catch {
				continue;
			}
			if (nameLower && String(record.characterName ?? '').toLowerCase() !== nameLower) continue;
			const eventName = String(record.eventName ?? '(unbekannt)');
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			let fertigkeitsName = null;
			if (eventName === 'probe') {
				fertigkeitsName = payload?.fertigkeit?.name ?? null;
			}
			else if (eventName === 'schip') {
				fertigkeitsName = payload?.fertigkeit?.name ?? null;
			}
			else if (eventName === 'angriff') {
				fertigkeitsName = payload?.waffe?.name ?? null;
			}
			const key = fertigkeitsName ? `${eventName}: ${fertigkeitsName}` : eventName;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return [...counts.entries()]
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	}

	trimEvents(keepLast) {
		if (!fs.existsSync(this.filePath)) {
			return { before: 0, after: 0 };
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const before = lines.length;
		if (before <= keepLast) {
			return { before, after: before };
		}
		const kept = keepLast === 0 ? [] : lines.slice(-keepLast);
		if (kept.length === 0) {
			fs.writeFileSync(this.filePath, '', 'utf8');
		}
		else {
			fs.writeFileSync(this.filePath, kept.join('\n') + '\n', 'utf8');
		}
		return { before, after: kept.length };
	}

	readTopProbes({ characterName }) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const counts = new Map();
		for (const line of lines) {
			let record;
			try {
				record = JSON.parse(line);
			}
			catch {
				continue;
			}
			if (record.characterName !== characterName) continue;
			if (record.eventName !== 'probe') continue;
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			const fertigkeit = payload?.fertigkeit;
			if (!fertigkeit?.name || !fertigkeit?.kategorie) continue;
			const key = `${fertigkeit.kategorie}|${fertigkeit.name}`;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return [...counts.entries()]
			.map(([key, noOfExecutions]) => {
				const sep = key.indexOf('|');
				return { category: key.slice(0, sep), name: key.slice(sep + 1), noOfExecutions };
			})
			.sort((a, b) => b.noOfExecutions - a.noOfExecutions || a.name.localeCompare(b.name));
	}

	readRecentKsf({ characterName, count }) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const seen = new Set();
		const result = [];
		for (let i = lines.length - 1; i >= 0 && result.length < count; i--) {
			let record;
			try {
				record = JSON.parse(lines[i]);
			}
			catch {
				continue;
			}
			if (record.characterName !== characterName) continue;
			if (record.eventName !== 'ksf') continue;
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			const subcommand = payload?.ksfSubcommand;
			if (!subcommand) continue;
			const stufe = payload?.ksfStufe ?? null;
			const key = `${subcommand}|${stufe ?? ''}`;
			if (seen.has(key)) continue;
			seen.add(key);
			result.push({ subcommand, stufe, label: payload?.ksfLabel ?? subcommand });
		}
		return result;
	}

	readTopKsf({ characterName }) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const counts = new Map();
		const labels = new Map();
		for (const line of lines) {
			let record;
			try {
				record = JSON.parse(line);
			}
			catch {
				continue;
			}
			if (record.characterName !== characterName) continue;
			if (record.eventName !== 'ksf') continue;
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			const subcommand = payload?.ksfSubcommand;
			if (!subcommand) continue;
			const stufe = payload?.ksfStufe ?? null;
			const key = `${subcommand}|${stufe ?? ''}`;
			counts.set(key, (counts.get(key) ?? 0) + 1);
			if (!labels.has(key)) labels.set(key, payload?.ksfLabel ?? subcommand);
		}
		return [...counts.entries()]
			.map(([key, noOfExecutions]) => {
				const sep = key.indexOf('|');
				const subcommand = key.slice(0, sep);
				const stufeRaw = key.slice(sep + 1);
				return { subcommand, stufe: stufeRaw ? Number(stufeRaw) : null, label: labels.get(key), noOfExecutions };
			})
			.sort((a, b) => b.noOfExecutions - a.noOfExecutions || a.label.localeCompare(b.label));
	}

	readRecentMixed({ characterName, count }) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const seen = new Set();
		const result = [];
		for (let i = lines.length - 1; i >= 0 && result.length < count; i--) {
			let record;
			try {
				record = JSON.parse(lines[i]);
			}
			catch {
				continue;
			}
			if (record.characterName !== characterName) continue;
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			if (record.eventName === 'probe') {
				const fertigkeit = payload?.fertigkeit;
				if (!fertigkeit?.name || !fertigkeit?.kategorie) continue;
				const bonusMalus = payload?.bonusMalus ?? 0;
				const key = `probe|${fertigkeit.kategorie}|${fertigkeit.name}|${bonusMalus}`;
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({ type: 'probe', name: fertigkeit.name, category: fertigkeit.kategorie, bonusMalus });
			}
			else if (record.eventName === 'ksf') {
				const subcommand = payload?.ksfSubcommand;
				if (!subcommand) continue;
				const stufe = payload?.ksfStufe ?? null;
				const key = `ksf|${subcommand}|${stufe ?? ''}`;
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({ type: 'ksf', subcommand, stufe, label: payload?.ksfLabel ?? subcommand });
			}
			else if (record.eventName === 'angriff') {
				const waffenName = payload?.waffe?.name;
				if (!waffenName) continue;
				const bonusMalus = payload?.bonusMalusAngriff ?? 0;
				const key = `angriff|${waffenName}|${bonusMalus}`;
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({ type: 'angriff', waffenName, bonusMalus });
			}
			else if (record.eventName === 'parade') {
				const waffenName = payload?.waffe?.name;
				if (!waffenName) continue;
				const bonusMalus = payload?.bonusMalus ?? 0;
				const key = `parade|${waffenName}|${bonusMalus}`;
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({ type: 'parade', waffenName, bonusMalus });
			}
			else if (record.eventName === 'ausweichen') {
				const bonusMalus = payload?.bonusMalus ?? 0;
				const key = `ausweichen|${bonusMalus}`;
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({ type: 'ausweichen', bonusMalus });
			}
		}
		return result;
	}

	readTopMixed({ characterName }) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const raw = fs.readFileSync(this.filePath, 'utf8');
		const lines = raw.split('\n').filter(Boolean);
		const counts = new Map();
		const meta = new Map();
		for (const line of lines) {
			let record;
			try {
				record = JSON.parse(line);
			}
			catch {
				continue;
			}
			if (record.characterName !== characterName) continue;
			const payload = Array.isArray(record.payload) ? record.payload[0] : record.payload;
			if (record.eventName === 'probe') {
				const fertigkeit = payload?.fertigkeit;
				if (!fertigkeit?.name || !fertigkeit?.kategorie) continue;
				const key = `probe|${fertigkeit.kategorie}|${fertigkeit.name}`;
				counts.set(key, (counts.get(key) ?? 0) + 1);
				if (!meta.has(key)) meta.set(key, { type: 'probe', name: fertigkeit.name, category: fertigkeit.kategorie });
			}
			else if (record.eventName === 'ksf') {
				const subcommand = payload?.ksfSubcommand;
				if (!subcommand) continue;
				const stufe = payload?.ksfStufe ?? null;
				const key = `ksf|${subcommand}|${stufe ?? ''}`;
				counts.set(key, (counts.get(key) ?? 0) + 1);
				if (!meta.has(key)) meta.set(key, { type: 'ksf', subcommand, stufe, label: payload?.ksfLabel ?? subcommand });
			}
			else if (record.eventName === 'angriff') {
				const waffenName = payload?.waffe?.name;
				if (!waffenName) continue;
				const bonusMalus = payload?.bonusMalusAngriff ?? 0;
				const key = `angriff|${waffenName}|${bonusMalus}`;
				counts.set(key, (counts.get(key) ?? 0) + 1);
				if (!meta.has(key)) meta.set(key, { type: 'angriff', waffenName, bonusMalus });
			}
			else if (record.eventName === 'parade') {
				const waffenName = payload?.waffe?.name;
				if (!waffenName) continue;
				const bonusMalus = payload?.bonusMalus ?? 0;
				const key = `parade|${waffenName}|${bonusMalus}`;
				counts.set(key, (counts.get(key) ?? 0) + 1);
				if (!meta.has(key)) meta.set(key, { type: 'parade', waffenName, bonusMalus });
			}
			else if (record.eventName === 'ausweichen') {
				const bonusMalus = payload?.bonusMalus ?? 0;
				const key = `ausweichen|${bonusMalus}`;
				counts.set(key, (counts.get(key) ?? 0) + 1);
				if (!meta.has(key)) meta.set(key, { type: 'ausweichen', bonusMalus });
			}
		}
		return [...counts.entries()]
			.map(([key, noOfExecutions]) => ({
				...meta.get(key),
				noOfExecutions,
			}))
			.sort((a, b) => b.noOfExecutions - a.noOfExecutions || (a.name ?? a.label ?? '').localeCompare(b.name ?? b.label ?? ''));
	}
}

export function createEventHistoryProvider(config = {}) {
	const provider = String(config.eventHistoryProvider ?? DEFAULT_PROVIDER).toLowerCase();
	if (provider === 'ndjson') {
		const ndjsonPath = config.eventHistoryNdjsonPath
			? path.resolve(config.eventHistoryNdjsonPath)
			: DEFAULT_NDJSON_FILE;
		const blockedTypes = Array.isArray(config.eventHistoryBlockedPayloadTypes)
			? config.eventHistoryBlockedPayloadTypes
			: BLOCKED_PAYLOAD_TYPES_DEFAULT;
		logger.info('event-history.provider.ndjson', { filePath: ndjsonPath, blockedPayloadTypes: blockedTypes });
		return new NdjsonEventHistoryProvider(ndjsonPath, blockedTypes);
	}

	logger.warn('event-history.provider.unknown', { provider, fallback: 'noop' });
	return new NoopEventHistoryProvider();
}
