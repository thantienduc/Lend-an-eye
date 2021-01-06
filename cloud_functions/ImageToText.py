from Base64Manager import *
from google.cloud import vision
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "lendAnEarCred.json"

def convert_image_to_text(image_string):
    client = vision.ImageAnnotatorClient()
    image_file = decode_data(image_string)
    image = vision.Image(content=image_file)
    response = client.text_detection(image=image)
    texts = response.text_annotations
    return texts[0].description

# image_string = encode_image("test_image.jpg")
# print(convert_image_to_text(image_string))


