"use strict";
import * as vscode from "vscode";

export class NetdataReferenceProvider implements vscode.ReferenceProvider {
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
