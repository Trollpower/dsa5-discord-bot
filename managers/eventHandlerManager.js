import fs from 'fs';
import path from 'path';
import FileScanner from 'node-recursive-directory';
import { pathToFileURL } from 'url';
import logger from '../common/logger.js';

export default async function EventHandlerManager(DiscordClient, RootPath) {
	const eventFiles = await FileScanner(`${RootPath}/handlers`);
	eventFiles.forEach(async File => {
		if (fs.statSync(File).isDirectory()) return;
		const Event = await import(pathToFileURL(File).href);
		if (Event.ignore) {return;}
		else if (Event.isCustom) {await Event.run();}
		else if (Event.runOnce) {
			DiscordClient.once(Event.name, (...args) => Event.execute(...args, DiscordClient));
		}
		else {
			DiscordClient.on(Event.name, async (...args) => Event.execute(...args, DiscordClient));
		}
	});

	const slashCommandEvents = await FileScanner(`${RootPath}/events`);
	slashCommandEvents.forEach(async File => {
		if (fs.statSync(File).isDirectory()) return;
		const Event = await import(pathToFileURL(File).href);
		if (Event.ignore) {return;}
		else {
			logger.info('event-manager.add-event', { eventName: path.basename(File, '.js'), color: 'green' });
			try {
				DiscordClient.events.set(path.basename(File, path.extname(File)), Event);
			}
			catch (error) {
				logger.error('event-manager.add-event.error', { file: File, error });
			}
		}
	});
}