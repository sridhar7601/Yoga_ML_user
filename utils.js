import * as poseDetection from "@tensorflow-models/pose-detection";

import { feedbackState } from "./feedbackState";

const model = poseDetection.SupportedModels.MoveNet;
// const model = poseDetection.SupportedModels.BlazePose;

function drawResults(ctx, poses) {
	// console.log(poses);

	drawResult(ctx, maxPose);
}

function drawResult(ctx, pose) {
	if (pose != null && pose.keypoints != null) {
		drawKeypoints(ctx, pose.keypoints);
		drawSkeleton(ctx, pose.keypoints, pose.id);
	}
}

function drawKeypoints(ctx, keypoints) {
	const keypointInd = poseDetection.util.getKeypointIndexBySide(model);
	ctx.fillStyle = "Red";
	ctx.strokeStyle =
		feedbackState.value !== null &&
		feedbackState.value < feedbackState.minValue
			? "#8BDB81"
			: "white";
	ctx.lineWidth = 20;

	for (const i of keypointInd.middle) {
		drawKeypoint(ctx, keypoints[i]);
	}

	ctx.fillStyle = "Green";
	for (const i of keypointInd.left) {
		drawKeypoint(ctx, keypoints[i]);
	}

	ctx.fillStyle = "Orange";
	for (const i of keypointInd.right) {
		drawKeypoint(ctx, keypoints[i]);
	}
}

function drawKeypoint(ctx, keypoint) {
	const score = keypoint.score != null ? keypoint.score : 1;
	const scoreThreshold = 0.3;

	if (score >= scoreThreshold) {
		const circle = new Path2D();
		circle.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI);
		ctx.fill(circle);
		ctx.stroke(circle);
	}
}

function drawSkeleton(ctx, keypoints, poseId) {
	const color =
		feedbackState.value !== null &&
		feedbackState.value < feedbackState.minValue
			? "#8BDB81"
			: "white";
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = 10;

	poseDetection.util.getAdjacentPairs(model).forEach(([i, j]) => {
		const kp1 = keypoints[i];
		const kp2 = keypoints[j];

		// If score is null, just show the keypoint.
		const score1 = kp1.score != null ? kp1.score : 1;
		const score2 = kp2.score != null ? kp2.score : 1;
		const scoreThreshold = 0.3;

		if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
			ctx.beginPath();
			ctx.moveTo(kp1.x, kp1.y);
			ctx.lineTo(kp2.x, kp2.y);
			ctx.stroke();
		}
	});
}

export { drawResult, drawResults, drawKeypoint, drawKeypoints, drawSkeleton };
