import type { WidgetPlugin } from './_types'
import ArticleSlideshow from '../widgets/ArticleSlideshow.svelte'

export default {
	id:          'article-slideshow',
	label:       'Diaporama',
	icon:        '🎞',
	desc:        'Slideshow multi-source : articles mis en avant, vidéos YouTube, slides personnalisés.',
	family:      'content',
	phase:       1,
	component:   ArticleSlideshow,
	schema:      [],   // config gérée par le panel custom du builder
	customPanel: true,
} satisfies WidgetPlugin
