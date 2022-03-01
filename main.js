// import "./style.css"

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import { drawResult } from "./utils";
import {
	weightedDistanceMatching,
	getMappedParts,
	getMidPoint,
	l2norm,
	getRequiredAngles,
	weightedDistanceMatchingForAngles,
} from "./calculations";
import { feedbackState } from "./feedbackState";
import similarity from "compute-cosine-similarity/lib";
// Register one of the TF.js backends.
import "@tensorflow/tfjs-backend-webgl";
tf.setBackend("webgl");

const model = poseDetection.SupportedModels.MoveNet;
// const model = poseDetection.SupportedModels.BlazePose

let globalPose = null;
let poseToCompare ;
let curPoseVector ;
const id = localStorage.getItem("id");
const JUST_RENDER = "justRender";
const COMPARE = "compare";
let state = JUST_RENDER; // COMPARE is the other state
let video, 
 canvasLeft,
// canvasRight,
  ctx, detector, w, h;

// const NUM_POINTS = 13;
const NUM_POINTS = 10;

async function setupCanvas() {
	video = document.getElementById("video");
	 canvasLeft = document.getElementById("left_canvas");
	// canvasRight = document.getElementById("right_canvas");

	ctx = canvasLeft.getContext("2d");

	let webcamStream;
	try {
		webcamStream = await navigator.mediaDevices.getUserMedia({
			video: true,
		});
	} catch (err) {
		alert("Please enable webcam to access the site");
		return;
	}

	video.srcObject = webcamStream;
	await video.play();
	console.log(video.videoWidth, video.videoHeight);
	[w, h] = [video.videoWidth, video.videoHeight];

	 canvasLeft.width = w;
	 canvasLeft.height = h;
}

async function setupDetector() {
	// const detectorConfig = {
	// 	modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
	// };

	const detectorConfig = {
		modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
		minPoseScore: 0.3,
	};

	// const detectorConfig = {
	// 	runtime: 'tfjs',
	// 	enableSmoothing: true,
	// 	modelType: 'full'
	// };

	detector = await poseDetection.createDetector(model, detectorConfig);
}

function drawCtx() {
	ctx.drawImage(video, 0, 0, w, h);
}

function clearCtx() {
	ctx.clearRect(0, 0, w, h);
}

function checkFacePoint(kp) {
	return ["left_eye", "right_eye", "left_ear", "right_ear"].includes(kp.name);
}

async function getPoseVector(pose) {
	let angleVector =  getRequiredAngles(pose.keypoints);
	angleVector.push(pose.score);
	return angleVector;
}

function getPoseVectorKeypoints(pose) {
	let poseVector = [];
	if (pose === null || pose === undefined) return poseVector;

	// appending keypoints
	pose.keypoints.forEach((pt) => {
		if (checkFacePoint(pt)) return;
		poseVector.push(pt.x, pt.y);
	});

	// Applying l2 normalization on keypoints data alone.
	let norm = l2norm(poseVector);
	// console.log(norm, " norm");
	poseVector = poseVector.map((el) => el / norm);

	// appending scores
	pose.keypoints.forEach((pt) => {
		// console.log(pt);
		if (checkFacePoint(pt)) return;
		poseVector.push(pt.score);
	});
	// console.log(poseVector, 'pose');

	poseVector.push(pose.score);
	return poseVector;
}

function getCenteredKeypoints(keypoints, w, h) {
	let parts = getMappedParts(
		{
			left_hip: 1,
			right_hip: 1,
			left_shoulder: 1,
			right_shoulder: 1,
		},
		keypoints
	);

	console.log(parts);

	let [torzoMidX, torzoMidY] = getMidPoint(
		getMidPoint(parts.left_hip, parts.right_hip),
		getMidPoint(parts.left_shoulder, parts.right_shoulder)
	);

	let [videoMidX, videoMidY] = [w / 2, h / 2];
	let [offsetX, offsetY] = [videoMidX - torzoMidX, videoMidY - torzoMidY];

	return keypoints.map((point) => {
		return {
			...point,
			x: point.x + offsetX,
			y: point.y + offsetY,
		};
	});
}

async function loop() {
	clearCtx();
	drawCtx();

	const poses = await detector.estimatePoses(video, {
		maxPoses: 1,
		flipHorizontal: false,
	});
	if (poses.length > 0) {
		let pose = poses[0];
		globalPose = pose;

		// global assignment must include centered poses. easier for comparison.
		// globalPose = {
		// 	...pose,
		// 	keypoints: getCenteredKeypoints(pose.keypoints, w, h),
		// };

		// console.log(pose);

		// console.log(getPoseVector(globalPose));

		if ( poseToCompare != null && state === COMPARE) {
			 curPoseVector = await getPoseVector(globalPose);
			 //console.log(curPoseVector,"this is global");
			// console.log('this is posetocomp',
				// poseToCompare[0],
				// curPoseVector[0],
				// poseToCompare[6],"this is curvec",
				// curPoseVector
			// );
			let scoreMatch = weightedDistanceMatchingForAngles(
				poseToCompare,
				curPoseVector,
				NUM_POINTS
			);
			
			document.getElementById(
				"feedbackText"
			).innerHTML = `Matched ${scoreMatch}`;
			feedbackState.value = scoreMatch;
		}
		//ctx = canvasRight.getContext("2d");
		drawResult(ctx, globalPose);
	}

	// setTimeout(() => requestAnimationFrame(loop), 1)
	requestAnimationFrame(loop);
}

async function app() {
	await setupCanvas();
	await setupDetector();
	loop();
}

app();
async function apifetching(){

}
//let COUNT = 3;

// document.getElementById("capture").addEventListener("click", function (event) {
// 	let count = COUNT;
// 	let captureInterval = setInterval(function () {
// 		document.getElementById(
// 			"feedbackText"
// 		).innerText = `Capturing in ${count}`;

// 		if (count-- != 0) return;

// 		poseToCompare = getPoseVector(globalPose);
// 		ctx = canvasRight.getContext("2d");
// 		clearInterval(captureInterval);
// 		document.getElementById(
// 			"feedbackText"
// 		).innerText = `Captured ! Click compare to start comparing !`;
// 	}, 1000);
// });

//  document.getElementById("console").addEventListener("click", function (event) {
// 	let count = COUNT;
// 	let compareInterval = setInterval(function () {
// 		document.getElementById(
// 			"feedbackText"
// 		).innerText = `Starting to compare in ${count}`;
// console.log(count)
// 		if (count-- != 0) return;

// 		
// 		document.getElementById("feedbackText").innerText = `Comparing ...`;
// 		clearInterval(compareInterval);
// 	}, 1000);
//  });
const api_url = `https://staging.knowinmy.com/subscriptions/poses/?pose_id=${id}`;
async function getapi(api_url) {
    console.log("Entered")
	
	// = getPoseVector(globalPose);
    // Storing response
    const response = await fetch(api_url);
    
    // Storing data in form of JSON
    let data = await response.json();
	console.log(data.pose)
	//for img from api
	let imgsrc =   data.pose.image;
	let pic = `https://staging.knowinmy.com${imgsrc}`;
	console.log(id)

	//console.log(imge,"this is last log")
	//console.log(imgsrc)
	// var image = document.getElementsByClassName("image1");
	  
	// 	  image.src = `https://staging.knowinmy.com${imgsrc}`
	//console.log(image)
	
   // for vector from api
	poseToCompare = await data.pose.vector;
	if(poseToCompare != null){
		state = COMPARE;
	}
	async function displayImage(pic) {
		let divLocation = document.getElementById("right_canvas");
		console.log(id)
		let imgElement = document.createElement("img");
		imgElement.classList.add("img")
		imgElement.src = pic
		divLocation.append(imgElement);
	}
	 displayImage(pic)
	 console.log(id)
// 	let imgsrc =   data.pose.image

// 	let image = document.getElementsByClassName("imge");
// 	const imge = document.createElement("img");
// imge.src = `https://staging.knowinmy.com${imgsrc}`;

// // Append to another element:
// image.append(imge);

}

getapi(api_url);