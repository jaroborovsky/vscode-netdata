"use strict";
import * as vscode from "vscode";

export class NetdataDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
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
              name: objectName,
              kind: iconModule,

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
              kind: iconMethod,
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
              kind: iconModule,
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
