import gradio as gr
import numpy as np

first_time = True
input_img_original = None
with gr.Blocks() as demo:
    tolerance = gr.Slider(label="Tolerance", info="How different colors can be in a segment.", minimum=0, maximum=256*3, value=50)
    with gr.Row():
        #input_img = gr.Image(label="Input", tool="editor")
        input_img = gr.Image(label="Input", tool="sketch")
        print("input image config", input_img.get_config())
        output_img = gr.Image(label="Segmented image", tool="sketch")
        print("output image config", output_img.get_config())
    segment_btn = gr.Button("Segment image")

    def move_selection(img, d, evt: gr.SelectData):
        """Returns an image with the selected segment highlighted."""
        global first_time
        global input_img_original
        if first_time is True:
            input_img_original = img.copy()
            first_time = False

        pixels_in_segment = set()
        #mouse event: (x/col, y/row)
        #pixel: (row, col)
        x_orig, y_orig = evt.index
        x_offset, y_offset = evt.value
        print([x_offset, y_offset])
        img_height, img_width, _ = img.shape 
        for i in range(y_orig - d, y_orig + d + 1):
            for j in range(x_orig - d, x_orig + d + 1):
                if i >= 0 and i < img_height and j >= 0 and j < img_width:
                    pixels_in_segment.add((i, j))

        out = img.copy().astype(np.uint8)
        for pixel in pixels_in_segment:
            row = pixel[0] + y_offset
            col = pixel[1] + x_offset
            if row >= 0 and row < img_height and col >= 0 and col < img_width:
                out[row, col, :] = img[pixel]
                out[pixel] = 0
        return out
    
    def get_selection_move_data(img, evt: gr.SelectData):
        print(evt)
        return

    def get_segment (input_data):
        img_orig = input_data['image']
        img_segmented = np.zeros((img_orig.shape[0], img_orig.shape[1], 4), dtype=np.uint8)

        # Divide the image into 9 even squares
        square_size = img_orig.shape[0] // 3
        for i in range(3):
            for j in range(3):
                square = img_segmented[i*square_size:(i+1)*square_size, j*square_size:(j+1)*square_size]
                square[:, :, 0] = i*85
                square[:, :, 1] = j*85
                square[:, :, 2] = (i+j)*30
                square[:, :, 3] = (i*3+j+1)

        return img_segmented

    input_img.select(move_selection, [input_img, tolerance], input_img)
    segment_btn.click(get_segment, input_img, output_img)

#    input_img.selection_move(get_selection_move_data, input_img, input_img)

if __name__ == "__main__":
    demo.launch()
