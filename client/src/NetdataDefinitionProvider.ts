"use strict";
import * as vscode from "vscode";

export class NetdataDefinitionProvider implements vscode.DefinitionProvider {
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

      
      const possibleWord = document.getText(range);
      
      let myRange;
      let regexpMoj, regValue, objectName;

      let matchResult = possibleWord.match(/\bV(\d+)\b/);
      let variableNumber = matchResult ? parseInt(matchResult[1]) : null;
      if (variableNumber > 0) {
        let currentLine = position.line;
        let i = currentLine;
        let foundFunction = false;
        while (i >= 0 && !foundFunction) {
          //traverse back to function
          let line = document.lineAt(i);
          let trimLine = line.text.trim();
          let trimLineUpper = trimLine.toUpperCase();
          if (trimLineUpper.startsWith("%FUNCTION")) {
            foundFunction = true;
          } else i--;
        }
        let lineFunction = i;
        if (lineFunction < 0) resolve(null);
        i = lineFunction;
        let j = 0;
        let foundSelect = false;
        while (i < currentLine && !foundSelect) {
          //traverse find SELECT keyword
          let line = document.lineAt(i);
          let trimLine = line.text.trim();
          let lineUpper = line.text.toUpperCase();

          let columnSelect = lineUpper.indexOf("SELECT");
          if (columnSelect > -1) {
            j = columnSelect + 7;
            foundSelect = true;
          } else i++;
        }
        if (!foundSelect) resolve(null);
        let startVariableRange = { row: i, col: j };
        let endVariableRange = { row: i, col: j };
        //find variableNumber
        let variableNumberWasFound = false;
        
        let variableNumberCurrent = 1;
        let continueSearch = true;
        //traverse rows
        while (i < currentLine && !variableNumberWasFound && continueSearch) {
          // let continueRowSearch = true;
            let searchedLine = document.lineAt(i).text;
            let { token, pos } = findFirstImportantToken(searchedLine.substring(j));
            if (token === "FROM") {
              if (variableNumberCurrent === variableNumber) {
                //founded Vxx
                variableNumberWasFound = true;
                endVariableRange = { row: i, col: j + pos };
              }
              continueSearch = false;
          //    continueRowSearch = false;
            }
            if (token === "comma") {
              if (variableNumberCurrent === variableNumber) {
                //founded Vxx
                variableNumberWasFound = true;
             //   continueRowSearch = false;
                continueSearch = false;
                endVariableRange = { row: i, col: j + pos };
              } else {
                startVariableRange = { row: i, col: j + pos + 1 };
                variableNumberCurrent++;
                j = j + pos + 1;
              }
            }
            if (token === "leftParenthesis") {
              let { row, col } = getEndPositionOfBlock(i, j, "parenthesis", currentLine, document);
              i = row;
              j = col;
            }
            if (token === "commentStart") {
              let { row, col } = getEndPositionOfBlock(i, j, "comment", currentLine, document);
              i = row;
              j = col;
            }
            if (token === "notFound") {
         //     continueRowSearch = false;
              j = 0;
              i++;
            }
         
        }
        if (variableNumberWasFound) {
          startVariableRange=clearSpacesFromStart(startVariableRange, document);
          resolve({
            uri: document.uri,
            range: new vscode.Range(
              //new vscode.Position(i, j + columnComma + 1),
              new vscode.Position(startVariableRange.row, startVariableRange.col),
              new vscode.Position(endVariableRange.row, endVariableRange.col)
            ),
          });
        } else resolve(null);

        
      } else {
        for (var i = 0; i < document.lineCount; i++) {
          let line = document.lineAt(i);
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
      }
    });
  }
}

/** Returns first token and his position  from list  , (  %{ FROM  */
 function findFirstImportantToken(searchedLine: string) {
  const posLeftParerthesesStart=searchedLine.indexOf("("); //find parentheses in row
  const posComma = searchedLine.indexOf(",");
  const posCommentStart = searchedLine.indexOf("%{");
  const posFROM=searchedLine.indexOf("FROM");
  let foundedPositions=[]
  if ( posLeftParerthesesStart!==-1) foundedPositions.push(posLeftParerthesesStart)
  if (posComma!==-1) foundedPositions.push(posComma)
  if (posCommentStart!==-1) foundedPositions.push(posCommentStart)
  if (posFROM!==-1) foundedPositions.push(posFROM)
  const minPos = Math.min(...foundedPositions)
  if (minPos ===posLeftParerthesesStart) return {"token": "leftParenthesis", "pos": posLeftParerthesesStart}
  if (minPos ===posComma) return {"token": "comma", "pos": posComma}
  if (minPos ===posCommentStart) return {"token": "commentStart", "pos": posCommentStart}
  if (minPos ===posFROM) return {"token": "FROM", "pos": posFROM}
    return {"token": "notFound", "pos": -1}
}

/** Returns end position od block with parentheses */
 function getEndPositionOfBlock(ii, jj, type, stopLine, document){
  let searchtoken={"start":"x ", "end":"x"}
  if (type=="parenthesis") searchtoken={"start":"(", "end":")"}
  else if (type=="comment") searchtoken={"start":"%{", "end":"%}"}
  else return null
  let nestedLevelCount=0
  let continueSearch=true
  while (continueSearch){
    let searchedLine =document.lineAt(ii).text.substring(jj)
    let posLeftPar=searchedLine.indexOf(searchtoken.start); 
    let foundedLeftPar=posLeftPar>=0
    let posRightPar=searchedLine.indexOf(searchtoken.end);
    let foundedRightPar=posRightPar>=0
    if (!foundedLeftPar && !foundedRightPar) { 
      if (nestedLevelCount===0 ) break    //
      else {ii++  //next row 
      jj=0
      } 
    }
    if (foundedLeftPar){
      //skipBlock=true
     if( posLeftPar<posRightPar || !foundedRightPar) {         //deep down to next level
      nestedLevelCount++
      jj=jj+posLeftPar+1
      } 
    };
    if (foundedRightPar) {
      if (posRightPar < posLeftPar || !foundedLeftPar ) {         //return up from level
      nestedLevelCount--
      jj=jj+posRightPar+1
      if (nestedLevelCount===0) break
    }}
    if (ii>stopLine) break

  }
  return {"row": ii, "col": jj}
}

function clearSpacesFromStart(startVariableRange, document){
  let  {row, col} =startVariableRange

  //skip spaces
  let searchedLine = document.lineAt(row).text.substring(col)
  let skipSpacePos = searchedLine.indexOf(" ");
 
  while (skipSpacePos === 0 || searchedLine.length===0) {
    col ++;
    if (searchedLine.length === 0) {
      col = 0;
      row++;
    }
    searchedLine = document.lineAt(row).text.substring(col)
    skipSpacePos = searchedLine.indexOf(" ");
    
  }
  
  return {"row":row, "col": col}
}