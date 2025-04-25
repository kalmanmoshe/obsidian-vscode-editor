
import CodeFilesPlugin from "./main";
import * as monaco from 'monaco-editor'
import { genEditorSettings } from "./ObsidianUtils";


export class mountCodeEditor {
	contentEl: HTMLElement;
	value = "";
	monacoEditor: monaco.editor.IStandaloneCodeEditor;
	plugin: CodeFilesPlugin;

	constructor(
		contentEl: HTMLElement,
		plugin: CodeFilesPlugin,
		code: string,
		language: string,
		miniMap = true,
		wordWrap = false
	) {
		this.contentEl = contentEl;
		this.plugin = plugin;
		this.value = code;
		const settings = genEditorSettings(this.plugin.settings, language, miniMap, wordWrap);
		console.log("mountCodeEditor", language,settings);
		this.monacoEditor = monaco.editor.create(this.contentEl, settings);
		this.monacoEditor.setValue(this.value);
	}

	getValue() {
		return this.monacoEditor.getValue();
	}
}

