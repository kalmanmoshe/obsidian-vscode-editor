import { Editor } from "obsidian";
import CodeFilesPlugin from "./main";


import { getLanguage } from "./ObsidianUtils";
const codeBlockRegex = /^\s*(`|~){3,}/;
export class FenceEditContext {
	private start = 0;

	private end = 0;

	private editor?: Editor;

	private isInValidFence = false;

	private constructor(private plugin: CodeFilesPlugin) {
		this.validateFence();
		console.log("isInValidFence",this.isInValidFence)
	}

	static create(plugin: CodeFilesPlugin) {
		return new FenceEditContext(plugin);
	}

	private initializeStartAndEnd() {
		const cursor = this.editor?.getCursor();

		if (!this.editor || !cursor) return;

		this.start = cursor.line;
		this.end = cursor.line;
		const codeBlockStarts=this.editor?.getValue().split("\n").slice(0,this.start).filter((line) => line.match(codeBlockRegex)).length;
		while (
			this.start >= 0 &&
			!this.editor.getLine(this.start).match(codeBlockRegex)
		){
			this.start--;
		}
		if(this.start===this.end){
			this.end++;
		}
		while (
			this.end < this.editor.lineCount() &&
			!this.editor.getLine(this.end).match(codeBlockRegex)
		){
			this.end++;
		}
		console.log("this.FenceEditContext", this.end, this.start)
		console.log("this.FenceEditContext", this.editor.getLine(this.start), this.editor.getLine(this.end))
	}

	private validateFence() {
		this.editor = this.plugin.app.workspace.activeEditor?.editor;
		const file = this.plugin.app.workspace.activeEditor?.file;
		if (!file) return this.isInValidFence = false;
		const fileCache = app.metadataCache.getFileCache(file);
		if (!fileCache?.sections) return this.isInValidFence = false;
		const cursor = this.editor?.getCursor();
		if (!cursor) return this.isInValidFence = false;
		
		const section = fileCache.sections.find((section) => {
			if (section.type !== "code") return false;
			return (
				section.position.start.line <= cursor.line &&
				section.position.end.line >= cursor.line
			);
		})
		this.isInValidFence = !!section;
	}

	isInFence() {
		return this.isInValidFence;
	}

	getFenceData() {
		this.initializeStartAndEnd();
		if (!this.editor || !this.isInValidFence) return null;

		let editorContent = "";
		for (let i = this.start + 1; i < this.end; i++) {
			editorContent += `${this.editor.getLine(i)}\n`;
		}

		const content = editorContent.slice(0, editorContent.length - 1);
		const langKey = this.editor.getLine(this.start)
			.replace(codeBlockRegex, "")
			.match(/\s*(\w)+/)?.[0]||"";

		const language = getLanguage(langKey);

		return { content, language };
	}

	getEditor() {
		return this.editor;
	}

	getBounds() {
		return [this.start, this.end];
	}

	replaceFenceContent(value: string) {
		this.editor?.replaceRange(
			`${value}\n`,
			{ line: this.start + 1, ch: 0 },
			{ line: this.end, ch: 0 }
		);
	}
}
