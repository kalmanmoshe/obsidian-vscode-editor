import { EditorSettings } from "./common";
import * as monaco from 'monaco-editor'
import CodeFilesPlugin from "./main";

export const isObsidianThemeDark = () => document.body.classList.contains("theme-dark");

export function getThemeColor(themeColor: string): string {
    let theme = "vs";
    if (themeColor === "AUTO") {
        theme = isObsidianThemeDark() === true ? "vs-dark" : "vs";
    } else if (themeColor === "DARK") {
        theme = "vs-dark";
    } else if (themeColor === "LIGHT") {
        theme = "vs";
    }
    return theme;
}

export function genEditorSettings(setting: EditorSettings, language: string, minimap = true, wordwrap = false) {
    let minimapFlag = setting.minimap;
    if (minimap === false) {
        minimapFlag = false;
    }
    const minmap: monaco.editor.IEditorMinimapOptions = {
        enabled: minimapFlag,
    }

    let wordwrapFlag = setting.wordWrap;
    if (wordwrap === true) {
        wordwrapFlag = wordwrap;
    }
    const settings: monaco.editor.IStandaloneEditorConstructionOptions = {
        automaticLayout: true,
        language: getLanguage(language.toLowerCase()),
        theme: getThemeColor(setting.themeColor),
        lineNumbers: setting.lineNumbers ? "on" : "off",
        wordWrap: wordwrapFlag ? "on" : "off",
        minimap: minmap,
        folding: setting.folding,
        fontSize: setting.fontSize,
        // Controls whether characters are highlighted that can be confused with basic ASCII characters
        unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
        scrollBeyondLastLine: false,
        'semanticHighlighting.enabled': true,

    }
    return settings;
}

const languageExtensions: Record<string, string[]> = {
  latex: ["tex", "sty"],
  javascript: ["js", "es6", "jsx", "cjs", "mjs"],
  typescript: ["ts", "tsx", "cts", "mts"],
  json: ["json"],
  python: ["py", "rpy", "pyu", "cpy", "gyp", "gypi"],
  css: ["css"],
  html: ["html", "htm", "shtml", "xhtml", "mdoc", "jsp", "asp", "aspx", "jshtm"],
  cpp: ["cpp", "c++", "cc", "cxx", "hpp", "hh", "hxx"],
  graphql: ["graphql", "gql"],
  java: ["java", "jav"],
  php: ["php", "php4", "php5", "phtml", "ctp"],
  sql: ["sql"],
  yaml: ["yaml", "yml"],
  bat: ["bat", "batch", "cmd"],
  lua: ["lua"],
  ruby: ["rb", "rbx", "rjs", "gemspec"],
  markdown: ["markdown", "mdown", "mkdn", "mkd", "mdwn", "mdtxt", "mdtext", "mdx"],
  r: ["r", "rhistory", "rmd", "rprofile", "rt"],
  freemarker2: ["ftl", "ftlh", "ftlx"],
  restructuredtext: ["rst"],
  hcl: ["hcl", "tf", "tfvars"],
  ini: ["ini", "properties", "gitconfig"],
  pug: ["pug", "jade"],
  dart: ["dart"],
  rust: ["rs", "rlib"],
  less: ["less"],
  apex: ["cls"],
  tcl: ["tcl"],
  abap: ["abap"],
  ecl: ["ecl"],
  pla: ["pla"],
  vb: ["vb"],
  sb: ["sb"],
  m3: ["m3", "i3", "mg", "ig"],
  go: ["go"],
  mips: ["s"],
  perl: ["pl", "pm"],
  wgsl: ["wgsl"],
  twig: ["twig"],
  scss: ["scss"],
  redis: ["redis"],
  shell: ["sh", "bash"],
  scala: ["scala", "sc", "sbt"],
  julia: ["jl"],
  msdax: ["dax", "msdax"],
  lexon: ["lex"],
  razor: ["cshtml"],
  bicep: ["bicep"],
  azcli: ["azcli"],
  swift: ["swift"],
  flow9: ["flow"],
  xml: ["xml", "xsd", "dtd", "ascx", "csproj", "config", "props", "targets", "wxi", "wxl", "wxs", "xaml", "svgz", "opf", "xslt", "xsl"],
  kotlin: ["kt", "kts"],
  cypher: ["cypher", "cyp"],
  coffeescript: ["coffee"],
  fsharp: ["fs", "fsi", "ml", "mli", "fsx", "fsscript"],
  scheme: ["scm", "ss", "sch", "rkt"],
  sparql: ["rq"],
  aes: ["aes"],
  liquid: ["liquid", "html.liquid"],
  pascal: ["pas", "p", "pp"],
  elixir: ["ex", "exs"],
  qsharp: ["qs"],
  csharp: ["cs", "c#", "csharp", "csx", "cake"],
  clojure: ["clj", "cljs", "cljc", "edn"],
  cameligo: ["mligo"],
  sol: ["sol"],
  proto: ["proto"],
  postiats: ["dats", "sats", "hats"],
  pascaligo: ["ligo"],
  dockerfile: ["dockerfile"],
  handlebars: ["handlebars", "hbs"],
  powerquery: ["pq", "pqm"],
  "objective-c": ["m"],
  systemverilog: ["sv", "svh"],
  verilog: ["v", "vh"],
  st: ["st", "iecst", "iecplc", "lc3lib"],
  c: ["c", "h"],
};

const languageMap: Record<string, string> = {};

function normalizeModeName(name: string): string {
  return name
    .replace(/^(x|s)tex$/, "latex")
    .replace(/^jsx$/, "javascript")
    .replace(/^c#$/, "csharp");
}

function onLanguageChange(source: "CodeMirror" | "Monaco") {
  const monacoLanguages = monaco.languages.getLanguages();
  const allowedLanguages = monacoLanguages.map(l => l.id);
  const skippedLanguages: string[] = [];

  // Remove unsupported languages from existing record
  for (const lang of Object.keys(languageExtensions)) {
    if (!allowedLanguages.includes(lang)) {
      console.error(`Language ${lang} is not supported in monaco`);
      delete languageExtensions[lang];
    }
  }

  // @ts-ignore
  const modeInfo = window.CodeMirror.modeInfo as Array<{ name: string; mime: string; mode: string; ext?: string[] }>;
  // eslint-disable-next-line prefer-const
  for (let { name, mode, ext } of modeInfo) {
    name = normalizeModeName(name);
    mode = normalizeModeName(mode);

    if (!allowedLanguages.includes(mode)) {
      skippedLanguages.push(mode);
      continue;
    }

    if (!languageExtensions[mode]) languageExtensions[mode] = [];

    const existing = new Set(languageExtensions[mode].map(e => e.toLowerCase()));

    const extsToAdd = ext?.map(e => e.toLowerCase()) ?? [name.toLowerCase()];
    for (const e of extsToAdd) {
      if (!existing.has(e)) {
        languageExtensions[mode].push(e);
        existing.add(e);
      }
    }

    if (!existing.has(mode)) languageExtensions[mode].push(mode);
  }

  // Add in extensions from Monaco
  for (const { id, extensions } of monacoLanguages) {
    if (!languageExtensions[id]) languageExtensions[id] = [];

    const existing = new Set(languageExtensions[id].map(e => e.toLowerCase()));

    if (!extensions || extensions.length === 0) {
      if (!existing.has(id)) languageExtensions[id].push(id);
      continue;
    }

    for (const ext of extensions) {
      const cleaned = ext.toLowerCase().replace(/^\./, "");
      if (cleaned && !existing.has(cleaned)) {
        languageExtensions[id].push(cleaned);
        existing.add(cleaned);
      }
    }
  }
  rebuildLanguageMap();
}

function rebuildLanguageMap() {
  Object.keys(languageMap).forEach(k => delete languageMap[k]);
  for (const [language, extensions] of Object.entries(languageExtensions)) {
    for (const ext of extensions) {
      languageMap[ext.toLowerCase()] = language;
    }
  }
}

export function getLanguage(extension: string): string {
  if (Object.keys(languageMap).length === 0)
    onLanguageChange("Monaco");
  return languageMap[extension.toLowerCase()] ?? "plaintext";
}

export function trackMonacoLanguages(plugin: CodeFilesPlugin) {
  try {
    //@ts-expect-error
    window.CodeMirror.modeInfo = trackArray(window.CodeMirror.modeInfo, () => onLanguageChange("CodeMirror"));
  } catch (e) {
    console.warn("Failed to proxy CodeMirror.modeInfo", e);
  }

  trackMonacoLanguagesChange(monaco, () => onLanguageChange("Monaco"));

  // DEFERRED INIT
  if (plugin.app.workspace.layoutReady) {
    setTimeout(() => onLanguageChange("Monaco"), 100); // Delay to let plugins register
  } else {
    plugin.app.workspace.onLayoutReady(() => {
      setTimeout(() => onLanguageChange("Monaco"), 100);
    });
  }
}


function trackArray<T>(arr: T[], onChange: () => void): T[] {
  return new Proxy(arr, {
    set(target, prop, value) {
      if (prop !== "length") onChange();
      return Reflect.set(target, prop, value);
    },
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function" && ["push", "splice", "pop", "shift", "unshift"].includes(prop as string)) {
        return (...args: any[]) => {
          onChange();
          return (value as (...args: any[]) => any).apply(target, args);
        };
      }
      return value;
    }
  });
}

function trackMonacoLanguagesChange(monaco: any, onChange: () => void) {
  const original = monaco.languages.register;
  monaco.languages.register = function (...args: any[]) {
    const result = original.apply(this, args);
    onChange();
    return result;
  };
}

