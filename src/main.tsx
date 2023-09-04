import {MarkdownRenderChild} from "obsidian";
import * as React from "react";

import {KanbanBoard} from "./KanbanBoard";
import {createRoot} from "react-dom/client";


import { App } from 'obsidian';
import { AppContext } from "./context/AppContext";
import {BoardConfig, parseBoardConfig} from "./types";

export class Main extends MarkdownRenderChild {
	app: App;
	rawConfig: String;

	boardConfig;

	constructor(containerEl: HTMLElement, app: App, rawConfig: string) {
		super(containerEl);
		this.app = app;
		this.rawConfig = rawConfig
		console.log(rawConfig)
		this.boardConfig = parseBoardConfig(rawConfig);
	}

	async onload() {
		const root = createRoot(this.containerEl)

		if (!this.boardConfig.success){
			root.render(
				<div>There was an error parsing your config

				<div>
					{this.boardConfig.error.toString()}
				</div>

					<div>Sample Config: {JSON.stringify({
						"frontmatterAttribute": "TEst",
						"columns": ["a", "b", "c"],
						"cardOrigin": "origin",
						"columnWidth": "200px",
						"defaultColumnName": "Default",
						"defaultColor": "#FFAA00"
					})}



					</div>
				</div>
			);
			return
		}

		root.render(
			<AppContext.Provider value={this.app}>
				<KanbanBoard boardConfig={this.boardConfig.data} />
			</AppContext.Provider>
		);
	}
}
