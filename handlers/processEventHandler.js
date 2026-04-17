import logger from '../common/logger.js';
export const name = 'errorManager';
export const isCustom = true;
export async function run() {
	process.on('unhandledRejection', error => {
		logger.error('process.unhandledRejection', { error });
	});
	process.on('uncaughtException', error => {
		logger.error('process.uncaughtException', { error });
	});
	process.on('exit', code => {
		logger.info('process.exit', { code });
	});
}