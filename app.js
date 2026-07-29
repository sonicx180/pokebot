import { App } from '@slack/bolt';
import 'dotenv/config';

const app = new App({
	token: process.env.BOT_TOKEN,
	appToken: process.env.APP_TOKEN,
	socketMode: true,
});

const fetchPokemonData = async (name) => {
	const pokeData = await fetch(
		`https://pokeapi.co/api/v2/pokemon/${name}/`,
	).then((res) => res.json());
	return pokeData;
};
app.command('/180-ping', async ({ command, ack, respond }) => {
	const start = Date.now();
	await ack();
	const latency = Date.now() - start;
	await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command('/180-help', async ({ ack, respond }) => {
	await ack();
	await respond({
		text: `
    Avaliable Commands 
    : /180-ping - Checking bot latency
      /180-pokemon {pokemon name} - Stats on Pokemon of your choice
    `,
	});
});
app.command('/180-pokemon', async ({ command, ack, respond }) => {
	const pokeName = command.text.trim();
	await ack();
	if (!pokeName) {
		await respond({
			text: 'Please provide a Pokémon name! Example: `/180-pokemon pikachu`',
		});
		return;
	}

	try {
		const pokeData = await fetchPokemonData(pokeName);

		// Format stats into a clean list
		const statsList = pokeData.stats
			.map((s) => `• *${s.stat.name.toUpperCase()}:* ${s.base_stat}`)
			.join('\n');

		const typesList = pokeData.types
			.map((t) => (s) => t.type.name)
			.join(', ');

		// Send response using Slack Block Kit
		await respond({
			response_type:'in_channel',
			text: `Information for ${pokeData.name}`, // Fallback text for notifications
			blocks: [
				{
					type: 'header',
					text: {
						type: 'plain_text',
						text: `#${pokeData.id} - ${pokeData.name.toUpperCase()}`,
						emoji: true,
					},
				},
				{
					type: 'section',
					fields: [
						{
							type: 'mrkdwn',
							text: `*Height:* ${pokeData.height / 10} m`,
						},
						{
							type: 'mrkdwn',
							text: `*Weight:* ${pokeData.weight / 10} kg`,
						},
					],
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `*Base Stats:*\n${statsList}`,
					},
					accessory: {
						type: 'image',
						image_url:
							pokeData.sprites.front_default ||
							pokeData.sprites.other['official-artwork']
								.front_default,
						alt_text: pokeData.name,
					},
				},
				{
					type: 'divider',
				},
				{
					type: 'context',
					elements: [
						{
							type: 'mrkdwn',
							text: `Data fetched from *PokeAPI*`,
						},
					],
				},
			],
		});
	} catch (error) {
		await respond({ text: `Could not find Pokémon "${pokeName}".` });
	}
});

(async () => {
	await app.start();
	console.log('bot is running!');
})();
