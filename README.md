# Net.Data for Visual Studio Code

An extension for VS Code which provides support for the Net.Data language. Net.Data is a server-side scripting language that extends web servers by enabling the dynamic generation of web pages using data from a variety of data sources. The data sources can include relational and non-relational database management systems such as DB2, DRDA-enabled databases, flat-file data, and native applications written in programming languages such as RPG, Cobol, Java, C, C++, and REXX.
https://www.ibm.com/support/pages/netdata-ibm-i

## Functionality

This extension works for netdata file. It has the following language features:

- Syntax highlighting
- Snippets for frequently used commands
- Definition of Net.Data Language
- Simple Language Client
- Go To Definition for %FUNCTION, %MACRO_FUNCTION
- Outline structure of functions, report and html block

## Structure

```
.
├── client // Language Client
│   ├── src
│       └── extension.ts // Language Client entry point
├── syntaxes
│   └── netdata.tmLanguage.json   // syntax
└── package.json          // The extension manifest.
    snippets.netdata.json // Snippets.
    language-configuration.json  // Configuration of language
```

## Issues

https://github.com/jaroborovsky/vscode-netdata/issues

## Contribution

- Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
- Open VS Code on this folder.
- Press Ctrl+Shift+B to compile the client.
- Switch to the Debug viewlet.
- Select `Launch Client` from the drop down.
- Run the launch config.
- In the [Extension Development Host] instance of VSCode, open a document in 'netdata' language mode.
  - Type `html` or `funct` to see `@HTML` and `FUNCTION` snippet completion.

## Publish extension

- vsce package
