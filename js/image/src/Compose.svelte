<script>
	// @ts-nocheck

	import { onMount, onDestroy, createEventDispatcher, tick } from "svelte";
	import { draw, fade } from "svelte/transition";
	import { LazyBrush } from "lazy-brush/src";
	import ResizeObserver from "resize-observer-polyfill";
	import { get_coordinates_of_clicked_image } from "./utils";

	const dispatch = createEventDispatcher();

	export let value;
	export let value_img;
	export let mode = "sketch";
	export let brush_color = "#0b0f19";
	export let brush_radius;
	export let source;

	export let width = 400;
	export let height = 200;
	export let container_height = 200;
	export let shape;
	
	$: {
		console.log('source = ', source, 'mode = ', mode, 'width = ', width, 'height = ', height, 'container_height = ', container_height);	
	}

	$: {
		if (shape && (width || height)) {
			console.log("shape and width or height");
			console.log(shape, width, height);
			width = shape[0];
			height = shape[1];
		}
	}

	let mounted;

	let catenary_color = "#aaa";

	let canvas_width = width;
	let canvas_height = height;

	$: mounted && !value && clear();

	function mid_point(p1, p2) {
		return {
			x: p1.x + (p2.x - p1.x) / 2,
			y: p1.y + (p2.y - p1.y) / 2
		};
	}

	const canvas_types = [
		{
			name: "interface",
			zIndex: 15
		},
		{
			name: "drawing",
			zIndex: 16
		},
		{
			name: "temp",
			zIndex: 12
		},
		{
			name: "mask",
			zIndex: -1
		},
		{
			name: "temp_fake",
			zIndex: -2
		}
	];

	let canvas = {};
	let ctx = {};
	let points = [];
	let lines = [];
	let mouse_has_moved = true;
	let values_changed = true;
	let is_drawing = false;
	let is_pressing = false;
	let lazy = null;
	let canvas_container = null;
	let canvas_observer = null;
	let line_count = 0;
	let value_img_data_original = null;
	let value_img_data_opaque = null;
	let value_img_opaque = null;

	let changed_objects = [];
	let cropped_image = null;
	let current_object_id = 0;
	let cropping_img_data = null;
	let cropping_img = null;

	//user must wait for image to load before drawing
	function imagedata_to_image (imagedata) {
		var canvas = document.createElement ('canvas');
		var ctx = canvas.getContext ('2d');
		canvas.width = imagedata.width;
		canvas.height = imagedata.height;  		
		ctx.putImageData (imagedata, 0, 0);
		var dataURL = canvas.toDataURL ();
		var img = new Image ();
		img.src = dataURL;		
		return img;
	}

	function image_to_imagedata(image) {
		const canvas = document.createElement('canvas');
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	$: {
		console.log("Compose.svelte: value changed = ", value);
		console.log("Compose.svelte: value_img.complete:", value_img.complete)
	}

	function draw_cropped_image() {
		if (!shape) {

			console.log('draw_cropped_image: ', value_img);
	
			const x = canvas.temp.getBoundingClientRect();
			//console.log(`canvas width: ${ctx.temp.canvas.width}, canvas height: ${ctx.temp.canvas.height}`);
			//console.log(`img width: ${width}, height: ${height}`);
			if (value_img_opaque != null && value_img_opaque.complete == true) {
				ctx.temp.drawImage(value_img_opaque, 0, 0, width, height);
				if (changed_objects.length > 0) {
					for (let i = 0; i < changed_objects.length; i++) {
						const { img, pos } = changed_objects[i];
						//console.log(pos, img);
						ctx.temp.drawImage(img, pos.left, pos.top);
					}
				}
			}

			return;
		}

		console.log('shape:')
		console.log(shape)
		let _width = value_img.naturalWidth;
		let _height = value_img.naturalHeight;

		const shape_ratio = shape[0] / shape[1];
		const image_ratio = _width / _height;

		let x = 0;
		let y = 0;

		if (shape_ratio < image_ratio) {
			_width = shape[1] * image_ratio;
			_height = shape[1];
			x = (shape[0] - _width) / 2;
		} else if (shape_ratio > image_ratio) {
			_width = shape[0];
			_height = shape[0] / image_ratio;
			y = (shape[1] - _height) / 2;
		} else {
			x = 0;
			y = 0;
			_width = shape[0];
			_height = shape[1];
		}

		ctx.temp.drawImage(value_img, x, y, _width, _height);
	}

	onMount(async () => {
		Object.keys(canvas).forEach((key) => {
			ctx[key] = canvas[key].getContext("2d");
		});

		await tick();

		if (value_img) {
			//This block repeats the code in the loaded event listener block below, but it is necessary to ensure that the image is drawn
			//This is because for the first time, the value_img is already loaded by the time the event listener is added
			console.log("Compose.svelte:onMount: value_img.complete:", value_img.complete)
			console.log('Compose.svelte:onMount: value_img:', value_img)			

			changed_objects = [];
			cropped_image = null;
			current_object_id = 0;
			cropping_img_data = null;
			cropping_img = null;

			value_img_data_original = image_to_imagedata(value_img);
			value_img_data_opaque = new ImageData(value_img_data_original.width, value_img_data_original.height);
			value_img_data_opaque.data.set(value_img_data_original.data);
			var pixels = value_img_data_opaque.data; // get the pixel array
			for (var i = 0; i < pixels.length; i += 4) { 
				if (pixels[i+3] != 255) {
					pixels[i+3] = 255; 
				}
			}
			value_img_opaque = imagedata_to_image(value_img_data_opaque);
			value_img_opaque.onload = (_) => {
				console.log('value_img_opaque loaded');
				console.log("value_img_opaque:", value_img_opaque);
				draw_cropped_image();
				ctx.drawing.drawImage(canvas.temp, 0, 0, width, height);			
			};
		}

		value_img.addEventListener("load", (_) => {
			console.log('Compose.svelte:value_img loaded');

			changed_objects = [];
			cropped_image = null;
			current_object_id = 0;
			cropping_img_data = null;
			cropping_img = null;

			value_img_data_original = image_to_imagedata(value_img);
			value_img_data_opaque = new ImageData(value_img_data_original.width, value_img_data_original.height);
			value_img_data_opaque.data.set(value_img_data_original.data);
			var pixels = value_img_data_opaque.data; // get the pixel array
			for (var i = 0; i < pixels.length; i += 4) { 
				if (pixels[i+3] != 255) {
					pixels[i+3] = 255; 
				}
			}
			value_img_opaque = imagedata_to_image(value_img_data_opaque);
			console.log("value_img_opaque.complete:", value_img_opaque.complete);
			value_img_opaque.onload = (_) => {
				console.log('value_img_opaque loaded');
				console.log("value_img_opaque:", value_img_opaque);
				draw_cropped_image();
				ctx.drawing.drawImage(canvas.temp, 0, 0, width, height);			
			};
		});

		setTimeout(() => {
			if (source === "webcam") {
				ctx.temp.save();
				ctx.temp.translate(width, 0);
				ctx.temp.scale(-1, 1);
				ctx.temp.drawImage(value_img, 0, 0);
				ctx.temp.restore();
			} else {
				console.log('setTimeout: draw_cropped_image')
				draw_cropped_image();
			}

			ctx.drawing.drawImage(canvas.temp, 0, 0, width, height);

			draw_lines({ lines: lines.slice() });
			trigger_on_change('onMount line 236');
		}, 100);

		lazy = new LazyBrush({
			radius: brush_radius * 0.05,
			enabled: true,
			initialPoint: {
				x: width / 2,
				y: height / 2
			}
		});

		canvas_observer = new ResizeObserver((entries, observer, ...rest) => {
			handle_canvas_resize(entries, observer);
		});
		canvas_observer.observe(canvas_container);

		loop();
		mounted = true;

		requestAnimationFrame(() => {
			init();
			requestAnimationFrame(() => {
				clear();
			});
		});
	});

	function init() {
		const initX = width / 2;
		const initY = height / 2;
		lazy.update({ x: initX, y: initY }, { both: true });
		lazy.update({ x: initX, y: initY }, { both: false });
		mouse_has_moved = true;
		values_changed = true;
	}

	onDestroy(() => {
		mounted = false;
		canvas_observer.unobserve(canvas_container);
	});

	function redraw_image(_lines) {
		clear_canvas();

		if (value_img) {
			if (source === "webcam") {
				ctx.temp.save();
				ctx.temp.translate(width, 0);
				ctx.temp.scale(-1, 1);
				ctx.temp.drawImage(value_img, 0, 0);
				ctx.temp.restore();
			} else {
				draw_cropped_image();
			}

			if (!lines || !lines.length) {
				ctx.drawing.drawImage(canvas.temp, 0, 0, width, height);
			}
		}

		draw_lines({ lines: _lines });
		line_count = _lines.length;

		if (lines.length) {
			lines = _lines;
		}

		if (lines.length == 0) {
			dispatch("clear");
		}
	}

	export function clear_mask() {
		const _lines = [];

		redraw_image(_lines);
		trigger_on_change('clear_mask');
	}

	export function undo() {
		const _lines = lines.slice(0, -1);

		redraw_image(_lines);
		trigger_on_change('undo');
	}

	let get_save_data = () => {
		return JSON.stringify({
			lines: lines,
			width: canvas_width,
			height: canvas_height
		});
	};

	let draw_lines = ({ lines }) => {
		lines.forEach((line) => {
			const { points: _points, brush_color, brush_radius } = line;
			draw_points({
				points: _points,
				brush_color,
				brush_radius
			});

			if (mode === "mask") {
				draw_fake_points({
					points: _points,
					brush_color,
					brush_radius
				});
			}

			points = _points;

			return;
		});
		saveLine({ brush_color, brush_radius });
		if (mode === "mask") {
			save_mask_line();
		}
	};

	let handle_draw_start = (e) => {
		e.preventDefault();
		is_pressing = true;
		const { x, y } = get_pointer_pos(e);
		if (e.touches && e.touches.length > 0) {
			lazy.update({ x, y }, { both: true });
		}
		handle_pointer_move(x, y);
		line_count += 1;
	};

	let handle_draw_move = (e) => {
		e.preventDefault();
		const { x, y } = get_pointer_pos(e);

		clear_canvas()

		handle_pointer_move(x, y);
	};

	let handle_draw_end = (e) => {
		e.preventDefault();
		handle_draw_move(e);
		is_drawing = false;
		is_pressing = false;
		saveLine();

		if (mode === "mask") {
			save_mask_line();
		}
	};

	// Create the path
	var drag_start_x = null;
	var drag_start_y = null;
	var cropRect = {
	top: 0,
	left: 0,
	width: 0,
	height: 0
	};

	let find_bounding_box = (selected_obj_id) => {
		let min_x = value_img_data_original.width;
		let min_y = value_img_data_original.height;
		let max_x = 0;
		let max_y = 0;

		for (let y = 0; y < value_img_data_original.height; y++) {
			for (let x = 0; x < value_img_data_original.width; x++) {
				const index = (y * value_img_data_original.width + x) * 4;
				const pixels = value_img_data_original.data;
				const pixel_value = pixels[index + 3];

				if (pixel_value === selected_obj_id) {
					min_x = Math.min(min_x, x);
					min_y = Math.min(min_y, y);
					max_x = Math.max(max_x, x);
					max_y = Math.max(max_y, y);
				}
			}
		}

		return {
			top: min_y,
			left: min_x,
			width: max_x - min_x,
			height: max_y - min_y,
		};
	};

	function create_cropped_image(rect, obj_id) {
		return new Promise((resolve) => {
			cropping_img_data = new ImageData(value_img_data_original.width, value_img_data_original.height);
			cropping_img_data.data.set(value_img_data_original.data);
			for (let y = 0; y < cropping_img_data.height; y++) {
				for (let x = 0; x < cropping_img_data.width; x++) {
					const index = (y * cropping_img_data.width + x) * 4;
					const pixels_original = value_img_data_original.data;
					var pixels = cropping_img_data.data;
					if (pixels_original[index + 3] == obj_id) {
						pixels[index + 3] = 255;
					}
					else {
						pixels[index + 3] = 0;
					}
				}
			}
			//console.log("cropping_img_data =", cropping_img_data);
			cropping_img = imagedata_to_image(cropping_img_data);
			//console.log("cropping_img =", cropping_img);

			cropping_img.addEventListener("load", () => {
				const canvas = document.createElement("canvas");
				canvas.width = rect.width;
				canvas.height = rect.height;
				const ctx = canvas.getContext("2d");
				ctx.drawImage(
					cropping_img,
					cropRect.left,
					rect.top,
					rect.width,
					rect.height,
					0,
					0,
					rect.width,
					rect.height
				);
				var dst_img = new Image();
				dst_img.src = canvas.toDataURL();
				//console.log("dst_img =", dst_img);
				resolve(dst_img);
			});
		});
	}

	function construct_current_object(current_object_id)
	{
		let ids = changed_objects.map(obj => obj.id);
		console.log("changed obj ids =", ids);
		if (ids.includes(current_object_id)) {
		  	console.log("current_object_id is a chaged object");
			let current_obj = changed_objects.find(obj => obj.id === current_object_id);
			console.log("current_obj =", current_obj);			
			cropRect = current_obj.pos;
			cropped_image = current_obj.img;
			//console.log("cropped_image =", cropped_image);
			//console.log("cropRect =", cropRect);
		}
		else {
			cropRect = find_bounding_box(current_object_id);
			async function blocking_function() {
				cropped_image = await create_cropped_image(cropRect, current_object_id);
			}
			blocking_function();
			//console.log("cropped_image =", cropped_image);
			//console.log("cropRect =", cropRect);
		}
	}

	function identify_object_id(x, y) {
		const index = (Math.round(y) * value_img_data_original.width + Math.round(x)) * 4;
		const pixels = value_img_data_original.data; 
		console.log(`imageDataOriginal width and height: ${value_img_data_original.width}, ${value_img_data_original.height}`)
		console.log(`pixels length: ${pixels.length}`)
		console.log(`image space x and y: ${x}, ${y}`); 
		console.log(`pixel index: ${index}`);
		console.log(`pixel value: ${pixels[index]}, ${pixels[index+1]}, ${pixels[index+2]}, ${pixels[index+3]}`);
		var id_selected = pixels[index+3];
		if (changed_objects.length > 0) {
			for (let i = changed_objects.length - 1; i >= 0 ; i--) {
				const { id, pos } = changed_objects[i];
				console.log(id, pos);
				if (x >= pos.left && x < pos.left + pos.width && y >= pos.top && y < pos.top + pos.height)
				{
					id_selected = id;
					break;
				}
			}
		}
		return id_selected;
	}

	let handle_drag_start = (e) => {
		e.preventDefault();
		is_pressing = true;
		const { x, y } = get_pointer_pos(e);

		drag_start_x = x;
		drag_start_y = y;

		current_object_id = identify_object_id(x, y);
		if (current_object_id == 0) {
			console.log("no object is selected");
			is_pressing = false
			return;
		}
		construct_current_object(current_object_id);		
		console.log("handle_drag_start: changed_objects", changed_objects)
	};

	let handle_drag_move = (e) => {
		e.preventDefault();
		if (!is_pressing) {
			return;
		}

		clear_canvas();
		ctx.drawing.clearRect(0, 0, width, height);
		draw_cropped_image();
	
		const { x, y } = get_pointer_pos(e);
		const drag_move_x = x - drag_start_x;
		const drag_move_y = y - drag_start_y;
		const draw_x = cropRect.left + drag_move_x;
		const draw_y = cropRect.top + drag_move_y;
		if (cropped_image && cropped_image.complete) {
			ctx.drawing.drawImage(cropped_image, draw_x, draw_y);
		}
	};

	let erase_object = (obj_id) => {
		let min_x = value_img_data_opaque.width;
		let min_y = value_img_data_opaque.height;
		let max_x = 0;
		let max_y = 0;

		let ids = changed_objects.map(obj => obj.id);
		console.log("erase_object: changed obj ids =", ids);
		if (ids.includes(current_object_id)) {
			let index = changed_objects.findLastIndex(obj => obj.id === obj_id);
			for (let i = index - 1; i >= 0; i--) {
				if (changed_objects[i].id === obj_id) {
					changed_objects.splice(i, 1);
				} 
			}
		}

		//improve: not be necessary for objects that have been erased before
		for (let y = 0; y < value_img_data_opaque.height; y++) {
			for (let x = 0; x < value_img_data_opaque.width; x++) {
				const index = (y * value_img_data_opaque.width + x) * 4;
				const pixels_original = value_img_data_original.data;
				var pixels = value_img_data_opaque.data;
				if (pixels_original[index + 3] == obj_id) {
					pixels[index] = 0;
					pixels[index + 1] = 0;
					pixels[index + 2] = 0;										
					pixels[index + 3] = 0;
				}
			}
		}
		value_img_opaque = imagedata_to_image (value_img_data_opaque);
		value_img_opaque.addEventListener('load', () => {
			clear_canvas();
			console.log('erase_object: value_img_opaque loaded');
			draw_cropped_image();
		});

		return;
	};

	let handle_drag_end = (e) => {
		e.preventDefault();
		if (!is_pressing) {
			return;
		}
		is_pressing = false;
		mouse_has_moved = true;
		const { x, y } = get_pointer_pos(e);
		const drag_move_x = Math.round(x - drag_start_x);
		const drag_move_y = Math.round(y - drag_start_y);
		const draw_x = cropRect.left + drag_move_x;
		const draw_y = cropRect.top + drag_move_y;		
		changed_objects.push({id: current_object_id, pos: {left: draw_x, top: draw_y, width: cropRect.width, height: cropRect.height}, img: cropped_image});
		erase_object(current_object_id);

		dispatch("select", { index: [drag_move_x, drag_move_y], value: current_object_id });
		console.log("handle_drag_end: dispatch (select)")
	};

	let old_width = 0;
	let old_height = 0;
	let old_container_height = 0;
	let add_lr_border = false;

	let handle_canvas_resize = async () => {
		if (shape && canvas_container) {
			const x = canvas_container?.getBoundingClientRect();
			const shape_ratio = shape[0] / shape[1];
			const container_ratio = x.width / x.height;
			add_lr_border = shape_ratio < container_ratio;
		}

		if (
			width === old_width &&
			height === old_height &&
			old_container_height === container_height
		) {
			return;
		}
		const dimensions = { width: width, height: height };

		const container_dimensions = {
			height: container_height,
			width: container_height * (dimensions.width / dimensions.height)
		};

		await Promise.all([
			set_canvas_size(canvas.interface, dimensions, container_dimensions),
			set_canvas_size(canvas.drawing, dimensions, container_dimensions),
			set_canvas_size(canvas.temp, dimensions, container_dimensions),
			set_canvas_size(canvas.temp_fake, dimensions, container_dimensions),
			set_canvas_size(canvas.mask, dimensions, container_dimensions, false)
		]);

		if (!brush_radius) {
			brush_radius = 20 * (dimensions.width / container_dimensions.width);
		}

		loop({ once: true });

		setTimeout(() => {
			old_height = height;
			old_width = width;
			old_container_height = container_height;
		}, 10);
		await tick();

		clear();
	};

	$: {
		if (lazy) {
			init();
			lazy.setRadius(brush_radius * 0.05);
		}
	}

	$: {
		if (width || height) {
			handle_canvas_resize();
		}
	}

	let set_canvas_size = async (canvas, dimensions, container, scale = true) => {
		if (!mounted) return;
		await tick();

		const dpr = window.devicePixelRatio || 1;
		canvas.width = dimensions.width * (scale ? dpr : 1);
		canvas.height = dimensions.height * (scale ? dpr : 1);

		const ctx = canvas.getContext("2d");
		scale && ctx.scale(dpr, dpr);

		canvas.style.width = `${container.width}px`;
		canvas.style.height = `${container.height}px`;
	};

	let get_pointer_pos = (e) => {
		const rect = canvas.interface.getBoundingClientRect();

		let clientX = e.clientX;
		let clientY = e.clientY;
		if (e.changedTouches && e.changedTouches.length > 0) {
			clientX = e.changedTouches[0].clientX;
			clientY = e.changedTouches[0].clientY;
		}

		return {
			x: ((clientX - rect.left) / rect.width) * width,
			y: ((clientY - rect.top) / rect.height) * height
		};
	};

	let handle_pointer_move = (x, y) => {
		lazy.update({ x: x, y: y });
		const is_disabled = !lazy.isEnabled();
		if ((is_pressing && !is_drawing) || (is_disabled && is_pressing)) {
			is_drawing = true;
			points.push(lazy.brush.toObject());
		}
		if (is_drawing) {
			points.push(lazy.brush.toObject());			
			draw_points({
				points: points,
				brush_color,
				brush_radius
			});

			if (mode === "mask") {
				draw_fake_points({
					points: points,
					brush_color,
					brush_radius
				});
			}
		}
		mouse_has_moved = true;
	};

	let draw_points = ({ points, brush_color, brush_radius }) => {
		if (!points || points.length < 2) return;

		console.log("draw_points length", points.length)

		ctx.temp.lineJoin = "round";
		ctx.temp.lineCap = "round";

		ctx.temp.strokeStyle = brush_color;
		ctx.temp.lineWidth = brush_radius;
		if (!points || points.length < 2) return;

		console.log("draw_points length", points.length)
		let p1 = points[0];
		let p2 = points[1];
		ctx.temp.moveTo(p2.x, p2.y);
		ctx.temp.beginPath();

		for (var i = 1, len = points.length; i < len; i++) {
			var midPoint = mid_point(p1, p2);
			ctx.temp.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
			p1 = points[i];
			p2 = points[i + 1];
		}
		/*
		ctx.temp.lineTo(p1.x, p1.y);

		ctx.temp.stroke();
		*/
		//draw a rectangle instead
		ctx.temp.strokeStyle = 'red';
		ctx.temp.lineWidth = 5;
		ctx.temp.strokeRect(p1.x, p1.y, 50, 50);
		console.log('drawing rect at ', p1.x, p1.y);
	};

	let draw_fake_points = ({ points, brush_color, brush_radius }) => {
		if (!points || points.length < 2) return;

		ctx.temp_fake.lineJoin = "round";
		ctx.temp_fake.lineCap = "round";
		ctx.temp_fake.strokeStyle = "#fff";
		ctx.temp_fake.lineWidth = brush_radius;
		let p1 = points[0];
		let p2 = points[1];
		ctx.temp_fake.moveTo(p2.x, p2.y);
		ctx.temp_fake.beginPath();

		
		for (var i = 1, len = points.length; i < len; i++) {
			var midPoint = mid_point(p1, p2);
			ctx.temp_fake.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
			p1 = points[i];
			p2 = points[i + 1];
		}
		/*
		ctx.temp_fake.lineTo(p1.x, p1.y);
		ctx.temp_fake.stroke();
		*/
		//draw a rectangle instead
		ctx.temp_fake.strokeStyle = 'red';
		ctx.temp_fake.lineWidth = 5;
		ctx.temp_fake.strokeRect(p1.x, p1.y, 50, 50);
		console.log('drawing rect at ', p1.x, p1.y);		
	};

	let save_mask_line = () => {
		if (points.length < 1) return;
		points.length = 0;
		ctx.mask.drawImage(canvas.temp_fake, 0, 0, width, height);

		trigger_on_change('save_mask_line');
	};

	let saveLine = () => {
		if (points.length < 1) return;

		lines.push({
			points: points.slice(),
			brush_color: brush_color,
			brush_radius
		});

		if (mode !== "mask") {
			points.length = 0;
		}

		ctx.drawing.drawImage(canvas.temp, 0, 0, width, height);

		trigger_on_change('saveLine');
	};

	let trigger_on_change = (source) => {
		console.log(`trigger_on_change called from ${source}`);
		const x = get_image_data();
		dispatch("change", x);
	};

	export function clear() {
		lines = [];
		clear_canvas();
		line_count = 0;

		return true;
	}

	function clear_canvas() {
		values_changed = true;
		ctx.temp.clearRect(0, 0, width, height);

		ctx.temp.fillStyle = mode === "mask" ? "transparent" : "#FFFFFF";
		ctx.temp.fillRect(0, 0, width, height);

		if (mode === "mask") {
			ctx.temp_fake.clearRect(
				0,
				0,
				canvas.temp_fake.width,
				canvas.temp_fake.height
			);
			ctx.mask.clearRect(0, 0, width, height);
			ctx.mask.fillStyle = "#000";
			ctx.mask.fillRect(0, 0, width, height);
		}
	}

	let loop = ({ once = false } = {}) => {
		if (mouse_has_moved || values_changed) {
			const pointer = lazy.getPointerCoordinates();
			const brush = lazy.getBrushCoordinates();
//			draw_interface(ctx.interface, pointer, brush);
			mouse_has_moved = false;
			values_changed = false;
		}
		if (!once) {
			window.requestAnimationFrame(() => {
				loop();
			});
		}
	};

	$: brush_dot = brush_radius * 0.075;

	let draw_interface = (ctx, pointer, brush) => {
		ctx.clearRect(0, 0, width, height);

		// brush preview
		/*
		ctx.beginPath();
		ctx.fillStyle = brush_color;
		ctx.arc(brush.x, brush.y, brush_radius / 2, 0, Math.PI * 2, true);
		ctx.fill();

		// tiny brush point dot
		ctx.beginPath();
		ctx.fillStyle = catenary_color;
		ctx.arc(brush.x, brush.y, brush_dot, 0, Math.PI * 2, true);
		ctx.fill();
		*/
	};

	export function get_image_data() {
		return mode === "mask"
			? canvas.mask.toDataURL("image/jpg")
			: canvas.drawing.toDataURL("image/jpg");
	}
</script>

<div
	class="wrap"
	bind:this={canvas_container}
	bind:offsetWidth={canvas_width}
	bind:offsetHeight={canvas_height}
>
	{#if line_count === 0}
		<div transition:fade={{ duration: 50 }} class="start-prompt">
			Start drawing
		</div>
	{/if}
	{#each canvas_types as { name, zIndex }}
		<canvas
			key={name}
			style=" z-index:{zIndex};"
			class:lr={add_lr_border}
			class:tb={!add_lr_border}
			bind:this={canvas[name]}
			on:mousedown={
				name === "interface" ? handle_draw_start : 
				name === "drawing" ? handle_drag_start : 
				undefined
			}
			on:mousemove={
				name === "interface" ? handle_draw_move : 
				name === "drawing" ? handle_drag_move : 
				undefined
			}
			on:mouseup={
				name === "interface" ? handle_draw_end : 
				name === "drawing" ? handle_drag_end : 
				undefined
			}
			on:mouseout={name === "interface" ? handle_draw_end : undefined}
			on:blur={name === "interface" ? handle_draw_end : undefined}
			on:touchstart={name === "interface" ? handle_draw_start : undefined}
			on:touchmove={name === "interface" ? handle_draw_move : undefined}
			on:touchend={name === "interface" ? handle_draw_end : undefined}
			on:touchcancel={name === "interface" ? handle_draw_end : undefined}
			on:click|stopPropagation
		/>
	{/each}
</div>

<style>
	canvas {
		display: block;
		position: absolute;
		top: 0px;
		right: 0px;
		bottom: 0px;
		left: 0px;
		margin: auto;
	}

	.lr {
		border-right: 1px solid var(--border-color-primary);
		border-left: 1px solid var(--border-color-primary);
	}

	.tb {
		border-top: 1px solid var(--border-color-primary);
		border-bottom: 1px solid var(--border-color-primary);
	}

	canvas:hover {
		cursor: crosshair;
	}

	.wrap {
		position: relative;
		width: var(--size-full);
		height: var(--size-full);
		touch-action: none;
	}

	.start-prompt {
		display: flex;
		position: absolute;
		top: 0px;
		right: 0px;
		bottom: 0px;
		left: 0px;
		justify-content: center;
		align-items: center;
		z-index: var(--layer-4);
		touch-action: none;
		pointer-events: none;
		color: var(--body-text-color-subdued);
	}
</style>
