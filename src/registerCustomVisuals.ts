import * as monaco from 'monaco-editor'
export function registerCustomVisuals() {
    registerCustomLanguages();
    registerCustomThemes();
}
function registerCustomLanguages(){
	monaco.languages.register({ id: "latex" });
	monaco.languages.setMonarchTokensProvider("latex", {
		tokenizer: {
			root: [
				[/\\[a-zA-Z]+/, "keyword"],
				[/%.*$/, "comment"],
			],
		},
	});
}
function registerCustomThemes(){
	
}