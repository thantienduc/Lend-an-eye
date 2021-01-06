import base64

def encode_data(path):
    with open(path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode()
        return encoded_string
def decode_data(base64str):
    imgdata = base64.b64decode(base64str)
    return imgdata

##import pyperclip
##pyperclip.copy(encode_data("test_image.jpg"))
##pyperclip.copy(encode_data("japanese.wav"))


