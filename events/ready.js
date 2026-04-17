import path from 'path';
import logger from '../common/logger.js';

export default {
	name: 'ready',
	once: true,
	execute(client) {
		logger.info('event.ready', {
			event: path.basename(import.meta.url, '.js'),
			userTag: client.user.tag,
		});
	},
};