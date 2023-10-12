"use strict";
import * as vscode from "vscode";

// https://github.com/microsoft/vscode-python/blob/master/src/client/workspaceSymbols/parser.ts
// CTRL-SHITF-B skompliovat typescript

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider({ language: "netdata" }, new NetdataDocumentSymbolProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider({ language: "netdata" }, new NetdataDefinitionProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider({ language: "netdata" }, new NetdataReferenceProvider())
  );
}

class NetdataDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  public provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Thenable<vscode.SymbolInformation[]> {
    return new Promise((resolve, reject) => {
      var symbols = [];

      let iconClass = vscode.SymbolKind.Class; // HTML block
      let icon_second = vscode.SymbolKind.Field;
      let iconString = vscode.SymbolKind.String;
      const iconStruct = vscode.SymbolKind.Struct; //

      const iconFunction = vscode.SymbolKind.Function;
      const iconModule = vscode.SymbolKind.Module; // {} %FUNCION %MACRO_FUNCTION
      const iconMethod = vscode.SymbolKind.Method; // javascript function
      let regexpMoj, regValue, objectName;
      // console.log('moja Net.data extension :)' )

      function findClosingBracketMatchIndex(startRow, pos) {
        let openBracketCount = 0;
        const givenBracketPosition = 1;
        let indexC = -1;
        let indexR = -1;
        let p = pos;
        rowLoop: for (let i = startRow; i < document.lineCount; i++) {
          let str = document.lineAt(i).text;
          colLoop: while (p < str.length) {
            let openPos = str.indexOf("{", p);
            let closePos = str.indexOf("}", p);
            if (openPos != -1 && (closePos == -1 || openPos < closePos)) {
              //nasiel som otvaraciu & bud neexistu uzatvaracia nasleduje neskor
              //console.log('Pozor: koment block na riadku: '+ i+1 +'  stlpci:'+openPos+1+ '"' + str+ '"' )
              // console.log('open: '+openBracketCount+' ['+ i +', '+openPos+ '] "' + str+ '"' )
              openBracketCount++;
              p = openPos;
            } else if (closePos != -1) {
              // nasiel som uzatvaraciu
              if (openBracketCount === givenBracketPosition) {
                // som na urovni givenBracketPosition=1, mam co som chcel
                indexC = closePos;
                indexR = i;
                break rowLoop;
              }
              // console.log('close: '+openBracketCount+' ['+ i +', '+ closePos + '] "' + str+ '"' )
              openBracketCount--;
              p = closePos;
            } else if (openPos == -1 && closePos == -1) {
              break colLoop;
            }
            p++;
          }
          p = 0;
        }
        if (indexC == -1) {
          i = document.lineCount;
          indexC = 0;
        }
        //console.log('returnCloseBracektPos: '+openBracketCount+' ['+ indexR +', '+ indexC + '] ' )
        return { row: indexR, col: indexC };
      }

      for (var i = 0; i < document.lineCount; i++) {
        var line = document.lineAt(i);
        let trimLine = line.text.trim();
        let trimLineUpper = trimLine.toUpperCase();
        //console.log('line range'+JSON.stringify(line.range) )
        if (trimLine.toUpperCase().startsWith("%FUNCTION")) {
          let endPosition = findClosingBracketMatchIndex(line.range.start.line, line.range.start.character);
          //console.log('line test'+JSON.stringify(endPosition) )
          regexpMoj = /^%function\((\w*)\)\s*(\w*)(.*)/i;
          if (regexpMoj.test(trimLine)) {
            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[2];
            //let myRange =  new vscode.Range( line.range.start, new vscode.Position(118, 13) )
            let myRange = new vscode.Range(line.range.start, new vscode.Position(endPosition.row, endPosition.col));
            symbols.push({
              name: objectName, // tu je typ regValue[1]
              kind: iconModule, // vscode.SymbolKind.Field,
              // location: new vscode.Location(document.uri, line.range)
              location: new vscode.Location(document.uri, myRange),
            });
          }
        } else if (trimLineUpper.startsWith("FUNCTION")) {
          // console.log('xxxx' + trimLine )
          regexpMoj = /^function\s*(\w*)(.*)/i;
          if (regexpMoj.test(trimLine)) {
            let endPosition = findClosingBracketMatchIndex(line.range.start.line, line.range.start.character);
            let myRange = new vscode.Range(line.range.start, new vscode.Position(endPosition.row, endPosition.col));
            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[1];
            symbols.push({
              name: objectName,
              kind: iconMethod, // vscode.SymbolKind.Field,
              containerName: "ddsd",
              location: new vscode.Location(document.uri, myRange),
            });
          }
        } else if (trimLine.toUpperCase().startsWith("%MACRO_FUNCTION")) {
          regexpMoj = /^%macro_function\s*(\w*)(.*)/i;
          if (regexpMoj.test(trimLine)) {
            let endPosition = findClosingBracketMatchIndex(line.range.start.line, line.range.start.character);
            let myRange = new vscode.Range(line.range.start, new vscode.Position(endPosition.row, endPosition.col));

            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[1];
            symbols.push({
              name: objectName,
              kind: iconModule, // vscode.SymbolKind.Field,
              location: new vscode.Location(document.uri, myRange),
            });
          }
        } else if (trimLine.toUpperCase().startsWith("%HTML")) {
          regexpMoj = /^%html\((.*)\).*/i;
          if (regexpMoj.test(trimLine)) {
            let endPosition = findClosingBracketMatchIndex(line.range.start.line, line.range.start.character);
            let myRange = new vscode.Range(line.range.start, new vscode.Position(endPosition.row, endPosition.col));
            //console.log('HTML sekcia: ' + trimLine )
            //console.log('HTML pozicie: ' + endPosition.row + ' '+  endPosition.col )
            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[1];
            symbols.push({
              name: objectName,
              kind: iconClass,
              location: new vscode.Location(document.uri, myRange),
            });
          }
        } else if (trimLine.toUpperCase().startsWith("%REPORT")) {
          regexpMoj = /^%report.*/i;
          if (regexpMoj.test(trimLine)) {
            let endPosition = findClosingBracketMatchIndex(line.range.start.line, line.range.start.character);
            let myRange = new vscode.Range(line.range.start, new vscode.Position(endPosition.row, endPosition.col));
            regValue = regexpMoj.exec(trimLine);
            objectName = "report";
            symbols.push({
              name: objectName,
              kind: iconStruct,
              location: new vscode.Location(document.uri, myRange),
            });
          }
        }
      }

      resolve(symbols);
    });
  }
}

class NetdataDefinitionProvider implements vscode.DefinitionProvider {
  // provideDocumentSymbols(document: TextDocument, token: CancellationToken): ProviderResult<SymbolInformation[] | DocumentSymbol[]>;
  // public provideDocumentSymbols(document: vscode.TextDocument,
  //            token: vscode.CancellationToken): Thenable<vscode.SymbolInformation[]> {
  // provideDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Definition | DefinitionLink[]>;

  public provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Thenable<vscode.Definition> {
    return new Promise((resolve, reject) => {
      var symbols = [];

      // console.log('moja Net.data extension Definition :)' )
      /* https://stackoverflow.com/questions/50814413/how-to-implement-a-click-through-in-custom-html-mode-in-vs-code */
      // const linkText = getLinkText(document, position); // implement this

      /* if (! linkText) { 
                return null;
            } */

      const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
      const root = workspace ? workspace.uri : document.uri;

      /* return new vscode.Location(
                root.with({
                    path: path.join(root.path, linkText)
                }),
                new vscode.Position(0, 0)); */

      //  https://github.com/microsoft/vscode-python/blob/master/src/client/providers/definitionProvider.ts
      const filename = document.fileName;
      // console.log('filename: ' + filename)
      // console.log('position.line: ' + position.line)
      // console.log('position.line.text: ' + document.lineAt(position.line).text )
      if (document.lineAt(position.line).text.match(/^\s*\/\//)) {
        return;
      }
      if (position.character <= 0) {
        return;
      }

      const range = document.getWordRangeAtPosition(position);
      if (!range) {
        return;
      }

      // console.log('range'+JSON.stringify(range) )
      const possibleWord = document.getText(range);
      // console.log('possibleWord '+possibleWord)

      let myRange;
      let regexpMoj, regValue, objectName;
      for (var i = 0; i < document.lineCount; i++) {
        var line = document.lineAt(i);
        let trimLine = line.text.trim();
        let trimLineUpper = trimLine.toUpperCase();
        //console.log('line range'+JSON.stringify(line.range) )
        if (trimLineUpper.startsWith("%FUNCTION")) {
          regexpMoj = /^%function\((\w*)\)\s*(\w*)(.*)/i;
          if (regexpMoj.test(trimLine)) {
            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[2];
            if (objectName == possibleWord) {
              myRange = line.range;
              break;
            }
          }
        } else if (trimLineUpper.startsWith("%MACRO_FUNCTION")) {
          regexpMoj = /^%macro_function\s*(\w*)(.*)/i;
          if (regexpMoj.test(trimLine)) {
            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[1];
            if (objectName == possibleWord) {
              myRange = line.range;
              break;
            }
          }
        } else if (trimLineUpper.startsWith("FUNCTION")) {
          regexpMoj = /^function\s*(\w*)(.*)/i;
          if (regexpMoj.test(trimLine)) {
            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[1];
            if (objectName == possibleWord) {
              myRange = line.range;
              break;
            }
          }
        } else {
          regexpMoj = /^\s*(%DEFINE)?\s*(\w*)\s*=[^=]/i;
          if (regexpMoj.test(trimLine)) {
            regValue = regexpMoj.exec(trimLine);
            objectName = regValue[2];
            if (objectName == possibleWord) {
              myRange = line.range;
              break;
            }
          }
        }
      }

      let location;
      if (myRange !== undefined) {
        location = {
          uri: document.uri,
          range: myRange,
        };
      }
      //resolve(symbols);
      resolve(location);
    });
  }
}

class NetdataReferenceProvider implements vscode.ReferenceProvider {
  private referenceLocations(word: string, document: vscode.TextDocument): Promise<vscode.Location[]> {
    return new Promise<vscode.Location[]>((resolve, reject) => {
      const items: vscode.Location[] = new Array<vscode.Location>();
      let StringRegex = "\\b" + word + "\\b";
      let regexWordReference = new RegExp(StringRegex, "g");
      for (var i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i);
        let lineText = line.text;
        //let trimLine= line.text.trim();
        //let matchResult = line.text.match(regexWordReference);
        let offset = 0;
        let position = lineText.indexOf(word, offset);
        while (position >= 0) {
          //if (position >= 0) {
          //const definition = new vscode.Location(document.uri, new vscode.Position(i, 0));
          const range = new vscode.Range(
            new vscode.Position(i, position),
            new vscode.Position(i, position + word.length)
          );
          const definition = new vscode.Location(document.uri, range);
          items.push(definition);
          offset = offset + position;
          position = lineText.indexOf(word, position + word.length);
        }
      }
      //return reject (null);
      return resolve(items);
    });
  }

  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Location[]> {
    //const fileName: string = document.fileName;
    const word = document.getText(document.getWordRangeAtPosition(position)).split(/\r?\n/)[0];
    return this.referenceLocations(word, document).then((locs) => {
      return locs;
    });
  }
}
