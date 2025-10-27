// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.dester.in',
	base: '/',
	integrations: [
		starlight({
			title: 'DesterLib Docs',
			description: 'Documentation for DesterLib - Your Personal Media Server',
			logo: {
				src: './src/assets/logo.png',
				alt: 'DesterLib Logo',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/DesterLib/desterlib' },
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'index' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Installation', slug: 'getting-started/installation' },
					],
				},
				{
					label: 'Projects',
					items: [
						{ label: 'API Server', slug: 'api/overview' },
						{ label: 'Client Applications', slug: 'clients/overview' },
					],
				},
				{
					label: 'Client Platforms',
					items: [
						{ label: 'Platform Setup', slug: 'clients/flutter' },
					],
				},
				{
					label: 'Development',
					collapsed: false,
					items: [
						{ label: 'Contributing Guide', slug: 'development/contributing' },
						{ label: 'Project Structure', slug: 'development/structure' },
						{ label: 'Versioning Guide', slug: 'development/versioning' },
						{ label: 'Quick Reference', slug: 'development/quick-reference' },
						{ label: 'Commit Guidelines', slug: 'development/commit-guidelines' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Swagger Docs', link: 'http://localhost:3001/api/docs', attrs: { target: '_blank', rel: 'noopener noreferrer' } },
					],
				},
				// TODO: Add Deployment section when deployment guides are ready
				// {
				// 	label: 'Deployment',
				// 	autogenerate: { directory: 'deployment' },
				// },
			],
		}),
	],
});
