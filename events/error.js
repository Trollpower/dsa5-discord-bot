import path from 'path';
import logger from '../common/logger.js';

export default {
	name: 'error',
	once: true,
	execute(client) {
		logger.error('event.error', {
			event: path.basename(import.meta.url, '.js'),
			client,
		});
	},
};