
import { TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { viewType } from "./common";
import CodeFilesPlugin from "./main";
import * as monaco from 'monaco-editor'
import { genEditorSettings } from "./ObsidianUtils";
import { UserEventHandler } from "./userEventHandler";


export class CodeEditorView extends TextFileView {

	value = "";
	monacoEditor: monaco.editor.IStandaloneCodeEditor;
	eventHandler: UserEventHandler;

	constructor(leaf: WorkspaceLeaf, private plugin: CodeFilesPlugin) {
		super(leaf);
	}

	/*
	execute order: onOpen -> onLoadFile -> setViewData -> onUnloadFile -> onClose
	*/
	async onOpen() {
		this.file?.extension;
		await super.onOpen();
	}

	async onLoadFile(file: TFile) {
		const setting = genEditorSettings(this.plugin.settings, this.file?.extension ?? "");
		this.monacoEditor = monaco.editor.create(this.contentEl, setting);

		this.monacoEditor.onDidChangeModelContent(() => {
			this.requestSave();
		});
		this.eventHandler = new UserEventHandler(this.plugin, this.monacoEditor);
		this.addCtrlKeyWheelEvents();
		this.addKeyEvents();
		
		await super.onLoadFile(file);
	}

	async onUnloadFile(file: TFile) {
		window.removeEventListener('keydown', this.eventHandler.handleKeyDown.bind(this.eventHandler), true);
		await super.onUnloadFile(file);
		this.monacoEditor.dispose();
		this.monacoEditor = null!;
	}

	async onClose() {
		await super.onClose();
	}

	onResize() {
		this.monacoEditor.layout();
	}

	getViewType(): string {
		return viewType;
	}

	getContext(file?: TFile) {
		return file?.path ?? this.file?.path;
	}



	getViewData = () => {
		return this.monacoEditor.getValue();
	}

	setViewData = (data: string, clear: boolean) => {
		if (clear) {
			this.monacoEditor.getModel()?.setValue(data);
		} else {
			this.monacoEditor.setValue(data);
		}
	}
	clear = () => {
		this.monacoEditor.setValue('');
	}

	private addKeyEvents = () => {
		window.addEventListener('keydown', this.eventHandler.handleKeyDown.bind(this.eventHandler), true);
	}

	private addCtrlKeyWheelEvents = () => {
		this.containerEl.addEventListener('wheel', this.eventHandler.mousewheelHandle.bind(this.eventHandler), true);

	}

}
