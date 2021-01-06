from google.cloud import translate_v2
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "lendAnEarCred.json"

def translate_text(text,target):
    translate_client = translate.Client()
    result = translate_client.translate(text, target_language=target)
    return result["translatedText"]

# print(translate_text("What is your name?","hi"))
