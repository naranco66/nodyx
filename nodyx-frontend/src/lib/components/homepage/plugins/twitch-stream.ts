import type { WidgetPlugin } from './_types'
import TwitchStream from '../widgets/TwitchStream.svelte'

const plugin: WidgetPlugin = {
	id:        'twitch-stream',
	label:     'Twitch Stream',
	icon:      '📺',
	desc:      'Embed Twitch player avec habillage Nodyx — pseudo configurable, chat optionnel, bordure gradient animée.',
	family:    'media',
	phase:     1,
	component: TwitchStream,
	schema: [
		{
			key: 'channel', type: 'text', label: 'Chaîne Twitch',
			placeholder: 'pokled  ou  https://twitch.tv/pokled',
			required: true,
			hint: 'Pseudo ou URL complète — les deux fonctionnent.',
		},
		{
			key: 'layout', type: 'select', label: 'Disposition',
			default: 'video-only',
			options: [
				{ value: 'video-only',         label: 'Vidéo seule' },
				{ value: 'video-chat',         label: 'Vidéo + chat à droite (desktop)' },
				{ value: 'video-chat-bottom',  label: 'Vidéo + chat en bas' },
			],
			hint: 'Le chat passe en dessous sur mobile dans tous les cas.',
		},
		{
			key: 'height', type: 'number', label: 'Hauteur du player (px)',
			default: 378, min: 240, max: 720,
			hint: 'Ratio 16/9 recommandé : 378 pour 672 de large.',
		},
		{
			key: 'theme', type: 'select', label: 'Thème du player',
			default: 'dark',
			options: [
				{ value: 'dark',  label: 'Sombre' },
				{ value: 'light', label: 'Clair' },
			],
		},
		{
			key: 'autoplay', type: 'boolean', label: 'Autoplay',
			default: false,
			hint: 'Respecte la politique navigateur — forcé à muted si autoplay.',
		},
		{
			key: 'muted', type: 'boolean', label: 'Muet au démarrage',
			default: true,
		},
		{
			key: 'show_header', type: 'boolean', label: 'Afficher le header Nodyx',
			default: true,
			hint: 'Barre du haut avec logo Twitch, pseudo et bouton "Ouvrir".',
		},
		{
			key: 'accent_color', type: 'color', label: 'Couleur d\'accent',
			default: '#9146FF',
			hint: 'Violet Twitch par défaut. Change-la pour matcher ta charte.',
		},
		// ── Fallback catégorie (optionnel, nécessite credentials Twitch côté serveur) ──
		{
			key: 'fallback_category', type: 'text', label: 'Catégorie fallback (optionnel)',
			placeholder: 'Software and Game Development  ou  URL /directory/category/...',
			hint: 'Si la chaîne principale est offline, on affiche le stream le plus regardé de cette catégorie. Nécessite TWITCH_CLIENT_ID côté serveur.',
		},
		{
			key: 'fallback_language', type: 'select', label: 'Langue du fallback',
			default: 'any',
			options: [
				{ value: 'any', label: 'Toutes langues'   },
				{ value: 'fr',  label: 'Français'         },
				{ value: 'en',  label: 'English'          },
				{ value: 'es',  label: 'Español'          },
				{ value: 'de',  label: 'Deutsch'          },
				{ value: 'it',  label: 'Italiano'         },
				{ value: 'pt',  label: 'Português'        },
				{ value: 'nl',  label: 'Nederlands'       },
				{ value: 'ja',  label: '日本語'            },
				{ value: 'ko',  label: '한국어'            },
				{ value: 'zh',  label: '中文'              },
			],
			hint: 'Filtre les streams de la catégorie par langue.',
		},
	],
}

export default plugin
