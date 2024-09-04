import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
const cheerio = require('cheerio');
const https = require('https');


interface PasteURLPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: PasteURLPluginSettings = {
	mySetting: 'default'
}

export default class PasteURLPlugin extends Plugin {
	settings: PasteURLPluginSettings;

	async onload() {
		await this.loadSettings();

		console.log('我进来了');

		// 获取一个 url 文章的标题
		function get_title(app:App, result: string) {
			let title = '';
			let paste_url = '';
			
			const options = {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Referrer-Policy': 'strict-origin-when-cross-origin'
				}
			};
			
			https.get(result, options, (res: any) => {
			
					let data = ''
					res.on('data', (d: any) => {
						data += d;
					});
			
					res.on('end', () => {
						console.log(data)
						const $ = cheerio.load(data);
			
						const regex_wx = /https:\/\/mp.weixin.qq.com(.*)/
			
						if (result.match(regex_wx) ) {
							console.log('wx branch');
							
							const h1Element = $('h1.rich_media_title');
							const title = h1Element.text();
							paste_url = `[微信公众号文章](${result})`;
			
						} else {
							console.log('main branch');
			
							const el_title = $('title');
							const title_text = el_title.text();
			
							const el_h1 = $('h1');
							const h1_text = el_h1.text();
			
							const all_text = title_text + ' ' + h1_text;
							const cleaned_text = all_text.replace(/\s+/g, ' ').trim();
							title = cleaned_text
			
							paste_url = `[${title}](${result})`;
							
						}
						console.log(data)
						console.log(title)
						console.log(result)
			
						const view = app.workspace.getActiveViewOfType(MarkdownView);
						// Make sure the user is editing a Markdown file.
						if (view) {
								const cursor = view.editor.getCursor();
								view.editor.replaceRange(paste_url, cursor);
						}
					});
			
			}).on('error', (e: any) => {
					console.error(e);
					paste_url = 'Error';
			}); 
		}
		

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('cherry', 'Paste URL', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new PasteURLModal(this.app, (result) => get_title(this.app, result)
			).open();
		});
        
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('paste-url-plugin-ribbon-class');

		// This adds a simple command that can be triggered anywhere for pasteurl
		this.addCommand({
			id: 'past-url',
			name: 'Paste URL',
			callback: () => {
				new PasteURLModal(this.app, (result) => get_title(this.app, result)
        ).open();
			}
		});

		
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log('我又出去了');

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class PasteURLModal extends Modal {
	result: string;

	onSubmit: (result: string) => void

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("h3", { text: "请输入URL："});

		new Setting(contentEl)
		.setName("URL")
		.addText((text) =>
		  text.onChange((value) => {
			this.result = value
		  }));

    new Setting(contentEl)
		.addButton((btn) =>
			btn
			.setButtonText("提交")
			.setCta()
			.onClick(() => {
				this.close();
				this.onSubmit(this.result);
			}));
        
			contentEl.addEventListener("keyup", ({key}) => {
					if( key == 'Enter' && this.result !== undefined) {
							this.close();
			this.onSubmit(this.result);
					}
			});
		
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}