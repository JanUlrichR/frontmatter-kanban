import {HexColor} from "./types";

// https://24ways.org/2010/calculating-color-contrast
export const getContrastYIQ = (hexcolor: HexColor) => {
	var r = parseInt(hexcolor.substring(1,3),16);
	var g = parseInt(hexcolor.substring(3,5),16);
	var b = parseInt(hexcolor.substring(5,7),16);
	var yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? 'black' : 'white';
}
