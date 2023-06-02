export const get_coordinates_of_clicked_image = (
	evt: MouseEvent
): [number, number] | null => {
	let image = evt.currentTarget as HTMLImageElement;

	const imageRect = image.getBoundingClientRect();
	const xScale = image.naturalWidth / imageRect.width;
	const yScale = image.naturalHeight / imageRect.height;
	if (xScale > yScale) {
		const displayed_width = imageRect.width;
		const displayed_height = image.naturalHeight / xScale;
		const y_offset = (imageRect.height - displayed_height) / 2;
		var x = Math.round((evt.clientX - imageRect.left) * xScale);
		var y = Math.round((evt.clientY - imageRect.top - y_offset) * xScale);
	} else {
		const displayed_width = image.naturalWidth / yScale;
		const displayed_height = imageRect.height;
		const x_offset = (imageRect.width - displayed_width) / 2;
		var x = Math.round((evt.clientX - imageRect.left - x_offset) * yScale);
		var y = Math.round((evt.clientY - imageRect.top) * yScale);
	}
	const type = typeof evt.currentTarget
	console.log(type);
	console.log(image.naturalWidth, image.naturalHeight);
	console.log(evt.clientX, evt.clientY, xScale, yScale, x, y);
	console.log(imageRect) 
	if (x < 0 || x >= image.naturalWidth || y < 0 || y >= image.naturalHeight) {
		return null;
	}
	return [x, y];
};

export const createLoadObserver = (handler: () => void) => {
	let waiting = 0;

	const onload = (el: EventTarget & { addEventListener: (type: string, listener: () => void) => void }) => {
		waiting++;
		el.addEventListener('load', () => {
			waiting--;
			if (waiting === 0) {
				handler();
			}
		});
	};

	return onload;
};
