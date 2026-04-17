const LEVEL_PRIORITY = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

const DEFAULT_LEVEL = 'info';
const TRACE_ID_FIELD = 'traceId';
const META_COLOR_FIELD = 'color';
const LOG_FORMATS = {
	pretty: 'pretty',
	json: 'json',
};
const DEFAULT_FORMAT = LOG_FORMATS.pretty;
const ANSI_RESET = '\x1b[0m';
const ANSI_COLORS = {
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	gray: '\x1b[90m',
	grey: '\x1b[90m',
};
const DEFAULT_LEVEL_COLORS = {
	debug: 'yellow',
	info: 'green',
	warn: 'yellow',
	error: 'red',
};
const LEVEL_LABEL_COLORS = {
	warn: 'yellow',
	error: 'red',
};

const normalizeLevel = (level) => {
	const normalized = String(level ?? '').toLowerCase();
	return Object.prototype.hasOwnProperty.call(LEVEL_PRIORITY, normalized)
		? normalized
		: DEFAULT_LEVEL;
};

const getActiveLevel = () => normalizeLevel(process.env.LOG_LEVEL);

const normalizeFormat = (format) => {
	const normalized = String(format ?? '').toLowerCase();
	if (normalized === LOG_FORMATS.json) return LOG_FORMATS.json;
	if (normalized === LOG_FORMATS.pretty) return LOG_FORMATS.pretty;
	return DEFAULT_FORMAT;
};

const getActiveFormat = () => normalizeFormat(process.env.LOG_FORMAT);

const normalizeMetaColor = (color) => {
	const normalized = String(color ?? '').toLowerCase();
	return ANSI_COLORS[normalized] ? normalized : undefined;
};

const colorize = (text, color) => {
	const normalizedColor = normalizeMetaColor(color);
	if (!normalizedColor) return text;
	return `${ANSI_COLORS[normalizedColor]}${text}${ANSI_RESET}`;
};

const isLevelEnabled = (level) => {
	const activeLevel = getActiveLevel();
	const normalizedLevel = normalizeLevel(level);
	return LEVEL_PRIORITY[normalizedLevel] >= LEVEL_PRIORITY[activeLevel];
};

const serializeError = (error) => {
	if (!(error instanceof Error)) return error;
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
};

const safeStringify = (entry) => {
	const seen = new WeakSet();
	return JSON.stringify(entry, (_key, value) => {
		if (typeof value === 'bigint') {
			return value.toString();
		}
		if (value instanceof Error) {
			return serializeError(value);
		}
		if (value && typeof value === 'object') {
			if (seen.has(value)) {
				return '[Circular]';
			}
			seen.add(value);
		}
		return value;
	});
};

const formatMetaValue = (value) => {
	if (value === undefined) return undefined;
	if (value instanceof Error) return safeStringify(serializeError(value));
	if (value === null) return 'null';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
		return String(value);
	}
	return safeStringify(value);
};

const HIGHLIGHTED_META_KEYS = ['eventName', 'fertigkeit'];

const toPrettyLine = (entry) => {
	const levelLabel = entry.level.toUpperCase();
	const coloredLevelLabel = colorize(levelLabel, LEVEL_LABEL_COLORS[entry.level]);
	const metaColor = normalizeMetaColor(entry.meta?.[META_COLOR_FIELD])
		?? DEFAULT_LEVEL_COLORS[entry.level]
		?? undefined;
	const parts = Object.entries(entry.meta ?? {})
		.filter(([key]) => key !== META_COLOR_FIELD)
		.filter(([key]) => !HIGHLIGHTED_META_KEYS.includes(key))
		.filter(([, value]) => value !== undefined)
		.sort(([a], [b]) => {
			if (a === TRACE_ID_FIELD) return -1;
			if (b === TRACE_ID_FIELD) return 1;
			return a.localeCompare(b);
		})
		.map(([key, value]) => `${key}=${formatMetaValue(value)}`);
	const metaText = parts.length > 0 ? ` | ${parts.join(' ')}` : '';
	const coloredMetaText = metaText ? colorize(metaText, metaColor) : metaText;

	const highlights = HIGHLIGHTED_META_KEYS
		.map(key => entry.meta?.[key])
		.filter(Boolean)
		.map(value => colorize(String(value), 'cyan'));
	const highlightText = highlights.length > 0 ? ` ${highlights.join(' ')}` : '';

	return `${entry.ts} ${coloredLevelLabel} ${entry.event}${highlightText}${coloredMetaText}`;
};

const writeLog = (level, event, meta = {}) => {
	if (!isLevelEnabled(level)) return;

	const entry = {
		ts: new Date().toISOString(),
		level: normalizeLevel(level),
		event,
		meta,
	};
	const line = getActiveFormat() === LOG_FORMATS.json
		? safeStringify(entry)
		: toPrettyLine(entry);

	switch (entry.level) {
	case 'error':
		console.error(line);
		break;
	case 'warn':
		console.warn(line);
		break;
	default:
		console.log(line);
		break;
	}
};

const createTraceId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureInteractionTraceId = (interaction) => {
	if (!interaction) return undefined;
	if (!interaction[TRACE_ID_FIELD]) {
		interaction[TRACE_ID_FIELD] = createTraceId();
	}
	return interaction[TRACE_ID_FIELD];
};

const traceMeta = (interaction, meta = {}) => {
	const traceId = ensureInteractionTraceId(interaction);
	if (!traceId) return meta;
	return { traceId, ...meta };
};

const logger = {
	isLevelEnabled,
	traceMeta,
	ensureInteractionTraceId,
	debug: (event, meta) => writeLog('debug', event, meta),
	info: (event, meta) => writeLog('info', event, meta),
	warn: (event, meta) => writeLog('warn', event, meta),
	error: (event, meta) => writeLog('error', event, meta),
};

export default logger;
