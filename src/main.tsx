import {MarkdownRenderChild} from "obsidian";
import * as React from "react";

import {KanbanBoard} from "./KanbanBoard";
import {createRoot} from "react-dom/client";


import { App } from 'obsidian';
import { AppContext } from "./context/AppContext";

export class Main extends MarkdownRenderChild {
	el: HTMLElement;
	app: App;
	rawConfig: String;

	constructor(containerEl: HTMLElement, app: App, rawConfig: String) {
		super(containerEl);
		this.app = app;
		this.rawConfig = rawConfig
		console.log(rawConfig)
	}

	async onload() {
		const root = createRoot(this.containerEl);
		root.render(
			<AppContext.Provider value={this.app}>
				<KanbanBoard />
			</AppContext.Provider>
		);
	}
}
