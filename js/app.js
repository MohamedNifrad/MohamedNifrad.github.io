const video = document.getElementById("video");

const isScreenSmall = window.matchMedia("(max-width: 700px)");

let predictedAges = [];

async function playVideo () {
	await faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
	await faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
	await faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
	await faceapi.nets.faceExpressionNet.loadFromUri("/models"),
	await faceapi.nets.ageGenderNet.loadFromUri("/models")
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });
    video.srcObject = stream
}
playVideo();



//video window size
function screenResize(isScreenSmall) {
  if (isScreenSmall.matches) {
    // If media query matches
    video.style.width = "320px";
  } else {
    video.style.width = "500px";
  }
}

screenResize(isScreenSmall); // Call listener function at run time
isScreenSmall.addListener(screenResize);



video.addEventListener("playing", () => {
  
  console.log("playing called");
  // ### Creating a Canvas Element from an Image or Video Element
  const VideoCanvas = faceapi.createCanvasFromMedia(video);
  let container = document.querySelector(".container");
  container.append(VideoCanvas);

  // ### Init configs
  const displayValues = { 
	width: video.width, 
	height: video.height 
  };
  
  // ### Resize media elements
  faceapi.matchDimensions(VideoCanvas, displayValues);

  setInterval(async () => {
	  
    const detections = 
		await faceapi.detectSingleFace(
			video, 
			new faceapi.TinyFaceDetectorOptions())
		.withFaceLandmarks()
		.withFaceExpressions()
		.withAgeAndGender();
		
	// ### Input in to console result's detection
    // detections.map(console.log)

    const resizedDetections = faceapi.resizeResults(
		detections, 
		displayValues
	);
    console.log(resizedDetections);
	
	
	// ### Clear before picture
    VideoCanvas
		.getContext("2d")
		.clearRect(0, 0, VideoCanvas.width, VideoCanvas.height);

	// ### Drawing  in to VideoCanvas
    faceapi.draw.drawDetections(VideoCanvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(VideoCanvas, resizedDetections);
	
    if (resizedDetections && Object.keys(resizedDetections).length > 0) {
      const age = resizedDetections.age;
      const interpolatedAge = interpolateAgePredictions(age);
      const gender = resizedDetections.gender;
	  const genderProbability = resizedDetections.genderProbability;
      const expressions = resizedDetections.expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const emotion = Object.keys(expressions).filter(
        item => expressions[item] === maxValue
      );
      document.getElementById("age").innerText = `Age :- ${interpolatedAge}`;
      document.getElementById("gender").innerText = `Gender :- ${gender}`; 
      document.getElementById("emotion").innerText = `Emotion :- ${emotion[0]}`;
      document.getElementById("genderProbability").innerText = `Gender Probability :- ${genderProbability}`; 
    }
  }, 10);
});

function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);
  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}