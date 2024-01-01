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

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('cherry', 'Paste URL', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new PasteURLModal(this.app, (result) => {
                let title = '';
                let paste_url = '';
                
                https.get(result, (res) => {
                
                    let data = ''
                    res.on('data', (d) => {
                    data += d;
                    });
                
                    res.on('end', () => {
                    const $ = cheerio.load(data)
                    title = $('title').text();
                    console.log(`title is ${title}`);
                    paste_url = `[${title}](${result})`;
                    console.log(`[${title}](${result})`);

                    // new Notice(`${paste_url}的标题是${title}`);
            
                    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                    // Make sure the user is editing a Markdown file.
                    if (view) {
                        const cursor = view.editor.getCursor();
                        view.editor.replaceRange(paste_url, cursor);
                    }
                    });
                
                }).on('error', (e) => {
                    console.error(e);
                    paste_url = 'Error';
                }); 

            }).open();
		});
        
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('paste-url-plugin-ribbon-class');

		// This adds a simple command that can be triggered anywhere for pasteurl
		this.addCommand({
			id: 'past-url',
			name: 'Paste URL',
			callback: () => {
				new PasteURLModal(this.app, (result) => {
                    let title = '';
                    let paste_url = '';
                    
                    https.get(result, (res) => {
                    
                        let data = ''
                        res.on('data', (d) => {
                        data += d;
                        });
                    
                        res.on('end', () => {
                        const $ = cheerio.load(data)
                        title = $('title').text();
                        console.log(`title is ${title}`);
                        paste_url = `[${title}](${result})`;
                        console.log(`[${title}](${result})`);

                        // new Notice(`${paste_url}的标题是${title}`);
                
                        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                        // Make sure the user is editing a Markdown file.
                        if (view) {
                            const cursor = view.editor.getCursor();
                            view.editor.replaceRange(paste_url, cursor);
                        }
                        });
                    
                    }).on('error', (e) => {
                        console.error(e);
                        paste_url = 'Error';
                    }); 

                }).open();
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
		contentEl.createEl("h1", { text: "请输入URL："});

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
                // console.log(this.result);
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