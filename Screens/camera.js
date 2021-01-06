import React, { useState, useEffect } from 'react';
import { Text, View, Vibration } from 'react-native';
import { Camera } from 'expo-camera';
import { TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import * as ImageManipulator from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import ISO6391 from 'iso-639-1'; 


const CameraScreen = () => {

  // Permission Variables
  const [hasPermission, setHasPermission] = useState(null);

  // Camera Starting Variable Type - Set to back camera initially
  const [type, setType] = useState(Camera.Constants.Type.back);
  
  // Timeout Helper
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  // This is the camera reference object which will be initialized when view is started with correct camera permissions.
  var camera; 

  // Variable to translate to and read out loud! We would change this with our voice recognition.
  // ISO639 form is required by our endpoint - https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
  // BCP47 form is required by our text to speech front end function - https://appmakers.dev/bcp-47-language-codes-list/
  var languageChoice = "English";
  var desiredLanguageISO639 = ISO6391.getCode(languageChoice); 

  // Audio Recording Options
  const recordingOptions = {
    android: {
      extension: ".mp3",
      outputFormat: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AMR_WB,
      audioEncoder: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
      sampleRate: 16000,
    },
    ios: {
      extension: ".mp3",
      outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_AMR_WB,
      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
      sampleRate: 16000
    }
  };
  
  // Called at the Launch of App to Request Permission
  useEffect(() => {
    (async () => {
      const status_camera = await Camera.requestPermissionsAsync();
      const status_mic = await Audio.requestPermissionsAsync();
      setHasPermission(status_camera.status === "granted" && status_mic.status==="granted");
    })();
  }, []);

  // Returns an error screen assuming no permissions
  if (hasPermission === null || hasPermission === false) {return <View><Text>Camera Permission Issue</Text></View>;}

  var makePostRequest = async (url,data) => {
    var endPoint = url;
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    var jsonBody = JSON.stringify(data)
    var requestOptions = {method: 'POST', headers: headers, body: jsonBody, redirect: 'follow'};
    var response = await fetch(endPoint, requestOptions).catch(error => {console.log(error); return;});
    var response_text = await response.text();
    return response_text;
  }
  // Record Audio
  var reacordAudio = async () => {
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(recordingOptions);
    Vibration.vibrate();
    await sleep(500);
    Vibration.cancel();
    await recording.startAsync();
    await sleep(4000);
    const data = await recording.stopAndUnloadAsync();
    var fileBase64String = await FileSystem
    .readAsStringAsync(recording.getURI(), { encoding: FileSystem.EncodingType.Base64 })
    .catch((error)=> {console.log("Could not load file:\n"+error);});
    
    // Construct JSON body with our parsed text to translate to our desired language
    var translatorEndPoint = "https://us-central1-lend-an-ear-295120.cloudfunctions.net/voice_to_language_voice";
    var jsonBody = {"voice_string":fileBase64String}
    var translated_text = await makePostRequest(translatorEndPoint,jsonBody); 
    console.log(translated_text);
    languageChoice = translated_text
    desiredLanguageISO639 = ISO6391.getCode(languageChoice);
    Speech.speak(languageChoice);
  }
  
  // This function takes the picture then calls the onPictureSaved function
  var takePicture = () => {
      camera.takePictureAsync({ onPictureSaved: onPictureSaved });
  };

  // This function contains the photo data which is passed to our  image parser endpoint to parse text.
  // Then calls the translator endpoint to translate text.
  // Then reads out the text!
  var onPictureSaved = async photo => {  
      Speech.speak("Translating, please wait!");
      Vibration.vibrate();
      // Compress Image
      photo = await ImageManipulator.manipulateAsync(
        photo.uri,
        [],
        { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Load image from filesystem in string Base64 form
      var fileBase64String = await FileSystem
      .readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 })
      .catch((error)=> {console.log("Could not load file:\n"+error);});

      // Construct JSON body with our Base64 string and send it to our text parsing endpoint
      var imageParserEndPoint = "https://us-central1-lend-an-ear-295120.cloudfunctions.net/image_to_text";
      var jsonBody = {"image_string":fileBase64String}
      var parsed_text = await makePostRequest(imageParserEndPoint,jsonBody);

      // Construct JSON body with our parsed text to translate to our desired language
      var translatorEndPoint = "https://us-central1-lend-an-ear-295120.cloudfunctions.net/translate_text";
      var jsonBody = {"text":parsed_text, "target": desiredLanguageISO639};
      var translated_text = await makePostRequest(translatorEndPoint,jsonBody);
      
      // Now we speak!
      console.log(parsed_text,"=",translated_text);
      Speech.speak(translated_text,{language: desiredLanguageISO639});
  } 

  // The function triggered on scan button press
  var scanButtonFunction = () => {
    takePicture();
  }
  
  // The function triggered on Language Selection button press
  var languageSelectionButtonFunction = () => {
    reacordAudio();
  }

  // Main View that is returned assuming we get correct camera permissions.
  return (
    <View style={{ flex: 1 }}>
      <View style={{flex:0.2}}>
      <TouchableOpacity onPress = {() => {languageSelectionButtonFunction();}}>
      <View style = {{backgroundColor: 'purple', alignItems: 'center', 
                      justifyContent: 'center', height:"100%"}}
            >
          <Text style = {{color: 'white'}}>LANGUAGE SELECT RECORD</Text>
      </View>
      </TouchableOpacity>  
      </View>
      <Camera style={{ flex: 0.6 }} type={type} ref={(ref) => { camera = ref }}></Camera>
      <View style={{flex:0.2}}>
      <TouchableOpacity onPress = {() => {scanButtonFunction();}}>
      <View style = {{backgroundColor: 'purple', alignItems: 'center', 
                      justifyContent: 'center', height:"100%"}}
            >
          <Text style = {{color: 'white'}}>SCAN</Text>
      </View>
      </TouchableOpacity>
      </View>  
    </View>
  );
}

export default CameraScreen;