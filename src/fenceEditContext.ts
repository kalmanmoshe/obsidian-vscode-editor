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
	private shiftSections(shift: number,sections: {start:number,end:number}[]) {
		return sections.map(({start,end})=>({
			start:start+shift,
			end:end+shift
		}))
	}
	private parseInternalCodeBlock(codeBlockText: string): {start: number,end:number}[] {
		const codeBlockLines = codeBlockText.split("\n")
		const startIndex = codeBlockLines.findIndex((line) => codeBlockRegex.test(line));
		if (startIndex === -1) return [];
		const codeBlockDelimiter = codeBlockLines[startIndex].match(codeBlockRegex)?.[0] as string;
		let endIndex = codeBlockLines.findIndex((line,index) => index > startIndex 
		&& line.match(new RegExp(`^\\s*${codeBlockDelimiter.charAt(0)}{${codeBlockDelimiter.length},}\\s*$`)));
		if (endIndex === -1) endIndex = codeBlockLines.length-1;
		return [
			{start:startIndex,end:endIndex},
			...this.shiftSections(startIndex+1,this.parseInternalCodeBlock(codeBlockLines.slice(startIndex+1,endIndex).join("\n"))),
			...this.shiftSections(endIndex+1,this.parseInternalCodeBlock(codeBlockLines.slice(endIndex+1).join("\n")))
		]
	}

	private initializeStartAndEnd() {
		const cursor = this.editor?.getCursor();

		if (!this.editor || !cursor) return;
		const codeBlockLines = this.editor.getValue().split("\n").slice(this.start+1,this.end);
		const codeBlockText=codeBlockLines.join("\n");
		const sections = this.shiftSections(this.start+1,this.parseInternalCodeBlock(codeBlockText))
		const section = sections.find((section) => section.start <= cursor.line &&
		section.end >= cursor.line);
		if (section) {
			this.start = section.start;
			this.end = section.end;
		}
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
		if(section){this.start = section.position.start.line; this.end = section.position.end.line;}
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
