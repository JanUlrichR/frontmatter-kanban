import {App} from "obsidian";
import React from "react";
import {AppContext} from "../context/AppContext";

export const useApp = (): App  => {
	return <App>React.useContext(AppContext);
};
