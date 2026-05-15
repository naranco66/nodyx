<!--
  Rend du texte brut avec linkify + warning anti-phishing.
  Chaque URL devient un <a> qui, au click, intercepte la navigation et passe
  par le modal ExternalLinkWarning (sauf si liens internes Nodyx).
  Les URLs d'images sont rendues inline comme <img> click-pour-agrandir.

  Pas de {@html}, pas de innerHTML, pas de string concat HTML. Tout en
  composants Svelte natifs → XSS-safe par construction.
-->
<script lang="ts">
	import { linkify } from '$lib/linkify'
	import { requestOpenExternal } from '$lib/stores/externalLinkGuard'
	import { analyzeUrl } from '$lib/urlAnalysis'

	interface Props {
		text: string
	}

	let { text }: Props = $props()

	const segments = $derived(linkify(text))

	// Détecte les URL d'image (extensions courantes + uploads internes Nodyx).
	// Les images internes sont sûres, on les render inline sans warning.
	const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?(#.*)?$/i
	function isImageUrl(url: string): boolean {
		if (IMAGE_EXT_RE.test(url)) return true
		// /uploads/posts/{uuid}.webp etc (path interne sans extension dans la regex)
		if (url.startsWith('/uploads/') || url.includes('/uploads/posts/')) return true
		return false
	}

	function onLinkClick(e: MouseEvent, url: string) {
		const analysis = analyzeUrl(url)
		// Liens internes : navigation native (target=_blank pour ouvrir en
		// nouvel onglet, mais pas de modal de warning, c'est notre domaine).
		if (analysis.isInternal) return
		// Externe : on bloque la navigation et on demande confirmation.
		e.preventDefault()
		requestOpenExternal(url)
	}
</script>

<span class="message-body">
	{#each segments as seg, i (i)}
		{#if seg.type === 'text'}
			{seg.value}
		{:else if seg.type === 'mention'}
			<a href={`/users/${seg.username}`} class="message-body__mention">{seg.value}</a>
		{:else if seg.type === 'url' && isImageUrl(seg.href)}
			<a
				href={seg.href}
				target="_blank"
				rel="noopener noreferrer nofollow"
				class="message-body__image-wrap"
				onclick={(e) => onLinkClick(e, seg.href)}
				title="Cliquer pour ouvrir"
			>
				<img src={seg.href} alt="" class="message-body__image" loading="lazy" />
			</a>
		{:else if seg.type === 'url'}
			<a
				href={seg.href}
				target="_blank"
				rel="noopener noreferrer nofollow"
				class="message-body__link"
				onclick={(e) => onLinkClick(e, seg.href)}
			>{seg.value}</a>
		{/if}
	{/each}
</span>

<style>
	.message-body {
		white-space: pre-wrap;
		word-break: break-word;
	}
	.message-body__link {
		color: #93c5fd;
		text-decoration: underline;
		text-decoration-color: rgba(147, 197, 253, 0.4);
		text-underline-offset: 2px;
		transition: color .15s, text-decoration-color .15s;
		word-break: break-all;
	}
	.message-body__link:hover {
		color: #bfdbfe;
		text-decoration-color: rgba(191, 219, 254, 0.85);
	}
	.message-body__mention {
		color: #c4b5fd;
		font-weight: 600;
		text-decoration: none;
		padding: 0 2px;
		border-radius: 3px;
		transition: background .15s;
	}
	.message-body__mention:hover {
		background: rgba(196, 181, 253, 0.12);
	}

	.message-body__image-wrap {
		display: inline-block;
		margin: 4px 0;
		border-radius: 10px;
		overflow: hidden;
		max-width: 360px;
		max-height: 280px;
		transition: transform .2s cubic-bezier(.2,.8,.25,1);
		text-decoration: none;
	}
	.message-body__image-wrap:hover {
		transform: scale(1.01);
	}
	.message-body__image {
		display: block;
		max-width: 100%;
		max-height: 280px;
		object-fit: cover;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.04);
	}
</style>
