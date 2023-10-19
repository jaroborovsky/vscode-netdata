"use strict";
import * as vscode from "vscode";
import { NetdataDefinitionProvider } from "./NetdataDefinitionProvider";
import { NetdataDocumentSymbolProvider } from "./NetdataDocumentSymbolProvider";
import { NetdataReferenceProvider } from "./NetdataReferenceProvider";

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
