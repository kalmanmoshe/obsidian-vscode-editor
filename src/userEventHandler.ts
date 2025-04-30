import CodeFilesPlugin from "./main";
import * as monaco from 'monaco-editor'
function getCharFromCode(code: string) {
	if (code.startsWith("Key")) return code.slice(3).toLowerCase();
	if (code.startsWith("Digit")) return code.slice(5);
	return "";
  }

export class UserEventHandler {
	private plugin: CodeFilesPlugin;
	private editor: monaco.editor.IStandaloneCodeEditor;
	constructor(plugin: CodeFilesPlugin, editor: monaco.editor.IStandaloneCodeEditor) {
		this.plugin = plugin;
		this.editor = editor;
	}

    handleKeyDown = (event: KeyboardEvent) =>  {
		if(!this.editor.hasTextFocus())return;
		const ctrlMap = new Map<string, string>([
			['f', 'actions.find'],
			['h', 'editor.action.startFindReplaceAction'],
			['/', 'editor.action.commentLine'],
			['Enter', 'editor.action.insertLineAfter'],
			['[', 'editor.action.outdentLines'],
			[']', 'editor.action.indentLines'],
			['d', 'editor.action.copyLinesDownAction'],
			['v', 'paste'],
		]);
		

		if (event.ctrlKey) {
			const triggerName = ctrlMap.get(getCharFromCode(event.code));
			if (triggerName) {
				if(triggerName === 'paste'){
					navigator.clipboard.readText().then((clipboard) => {
						this.editor.trigger('source', triggerName, {text: clipboard });
					})
					/*
					navigator.clipboard.readText().then((clipboard) => {
						this.monacoEditor.trigger('source', 'editor.action.clipboardPasteAction', {
							text: clipboard
						});
						const selection = this.monacoEditor.getSelection();
						if (selection) {
							this.monacoEditor.executeEdits("paste", [{
								range: selection,
								text: clipboard,
								forceMoveMarkers: true
							}]);
						}
					})*/
				}
				else {
					this.editor.trigger('source', triggerName, null);
				}
			}
		}


		if (event.altKey) {
			if (event.key === 'z') {
				this.plugin.settings.wordWrap = !this.plugin.settings.wordWrap;
				this.plugin.saveSettings();
				this.editor.updateOptions({
					wordWrap: this.plugin.settings.wordWrap ? "on" : "off",
				})

			}
		}

	}
	mousewheelHandle = (event: WheelEvent) => {
		if (event.ctrlKey) {
			const delta = 0 < event.deltaY ? 1 : -1;
			this.plugin.settings.fontSize += delta;
			this.plugin.saveSettings();
			this.editor.updateOptions({
				fontSize: this.plugin.settings.fontSize,
			})
			// Stop event propagation, so that the editor doesn't scroll
			// scroll is monaco-editor's default behavior
			event.stopPropagation();
		}
	}
}
