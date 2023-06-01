<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { SelectData } from "@gradio/utils";
	import { BlockLabel, Empty, IconButton } from "@gradio/atoms";
	import { Download } from "@gradio/icons";
	import { get_coordinates_of_clicked_image } from "./utils";
	import { createLoadObserver } from "./utils";

	import { Image } from "@gradio/icons";

	export let value: null | string;
	export let label: string | undefined = undefined;
	export let show_label: boolean;
	export let selectable: boolean = false;

	const dispatch = createEventDispatcher<{
		change: string;
		select: SelectData;
	}>();

	$: value && dispatch("change", value);

	const handle_click = (evt: MouseEvent) => {
		let coordinates = get_coordinates_of_clicked_image(evt);
		if (coordinates) {
			dispatch("select", { index: coordinates, value: null });
		}
	};

	const handle_load = (evt: Event) => {
		console.log('handle_load!!!')
		const element = evt.currentTarget as HTMLImageElement;
		let img_width = element.naturalWidth;
		let img_height = element.naturalHeight;
		let container_height = element.getBoundingClientRect().height;

		console.log("StaticImage.svelte handle_image_load img_width:", img_width);
		console.log("StaticImage.svelte handle_image_load img_height:", img_height);	
		console.log("StaticImage.svelte handle_image_load container_height:", container_height);

		

	};

	const onload = createLoadObserver(() => {
        console.log('loaded!!!')
    })

</script>

<BlockLabel {show_label} Icon={Image} label={label || "Image"} />
{#if value === null}
	<Empty size="large" unpadded_box={true}><Image /></Empty>
{:else}
	<div class="download">
		<a
			href={value}
			target={window.__is_colab__ ? "_blank" : null}
			download={"image"}
		>
			<IconButton Icon={Download} label="Download" />
		</a>
	</div>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<img use:onload src={value} alt="" class:selectable on:click={handle_click} on:load|once={handle_load}/>

{/if}

<style>
	img {
		width: var(--size-full);
		height: var(--size-full);
		object-fit: contain;
	}

	.selectable {
		cursor: crosshair;
	}

	.download {
		position: absolute;
		top: 6px;
		right: 6px;
	}
</style>
