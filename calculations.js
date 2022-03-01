function euclideanDistance(p1, p2) {
	let [x1, y1] = p1;
	let [x2, y2] = p2;
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function getMappedParts(parts, keypoints) {
	let newParts = { ...parts };

	keypoints.forEach((kp) => {
		if (newParts[kp.name] !== undefined) {
			newParts[kp.name] = [kp.x, kp.y];
		}
	});

	return newParts;
}

function getMappedScores(parts, keypoints) {
	let newParts = { ...parts };

	keypoints.forEach((kp) => {
		if (newParts[kp.name] !== undefined) {
			newParts[kp.name] = kp.score;
		}
	});

	return newParts;
}

function getTorsoSize(pose) {
	if (pose == null || pose === undefined) return;
	// console.log(pose);
	let parts = {
		left_shoulder: 1,
		right_shoulder: 1,
		left_hip: 1,
		right_hip: 1,
		right_elbow: 1,
	};

	parts = getMappedParts(parts, pose.keypoints);

	// console.log(parts);
	// let midHip = midPoint(parts['left_hip'], parts['right_hip']);
	// let midShoulder = midPoint(parts['left_shoulder'], parts['right_shoulder']);

	return euclideanDistance(parts["left_shoulder"], parts["right_shoulder"]);
}

function getMidPoint(pt1, pt2) {
	let [x1, y1] = pt1;
	let [x2, y2] = pt2;
	return [(x1 + x2) / 2, (y1 + y2) / 2];
}

function cosineDistanceMatching(angleVector1, angleVector2) {
	let cosineSimilarity = similarity(angleVector1, angleVector2);
	let distance = 2 * (1 - cosineSimilarity);
	return Math.sqrt(distance);
}

function weightedDistanceMatching(angleVector1, angleVector2, num_points) {
	let vector1PoseXY = angleVector1.slice(0, num_points * 2);
	//console.log("this is anglevec2",vector1PoseXY);
	let vector1Confidences = angleVector1.slice(num_points * 2, num_points * 3);
	let vector1ConfidenceSum = angleVector1.slice(
		num_points * 3,
		num_points * 3 + 1
	);

	let vector2PoseXY = angleVector2.slice(0, num_points * 2);

	// First summation
	let summation1 = 1 / vector1ConfidenceSum;

	// Second summation
	let summation2 = 0;
	for (let i = 0; i < vector1PoseXY.length; i++) {
		let tempConf = Math.floor(i / 2);
		let tempSum =
			vector1Confidences[tempConf] *
			Math.abs(vector1PoseXY[i] - vector2PoseXY[i]);
		summation2 = summation2 + tempSum;
	}

	return summation1 * summation2;
}

function weightedDistanceMatchingForAngles(
	angleVector1,
	angleVector2,
	num_points
) {
	let vector1PoseXY = angleVector1.slice(0, num_points);
	let vector1Confidences = angleVector1.slice(num_points, num_points * 2);
	let vector1ConfidenceSum = angleVector1.slice(
		num_points * 2,
		num_points * 2 + 1
	);

	let vector2PoseXY = angleVector2.slice(0, num_points);

	// First summation
	let summation1 = 1 / vector1ConfidenceSum;

	// Second summation
	let summation2 = 0;
	for (let i = 0; i < vector1PoseXY.length; i++) {
		let tempConf = i;
		let tempSum =
			vector1Confidences[tempConf] *
			Math.abs(vector1PoseXY[i] - vector2PoseXY[i]);
		summation2 = summation2 + tempSum;
	}

	return summation1 * summation2;
}

function l2norm(arr, clbk) {
	let len = arr.length,
		t = 0,
		s = 1,
		r,
		val,
		abs,
		i;

	if (!len) {
		return null;
	}
	for (i = 0; i < len; i++) {
		val = arr[i];
		abs = val < 0 ? -val : val;
		if (abs > 0) {
			if (abs > t) {
				r = t / val;
				s = 1 + s * r * r;
				t = abs;
			} else {
				r = val / t;
				s = s + r * r;
			}
		}
	}
	return t * Math.sqrt(s);
}

function getPoint(direction, part) {
	return `${direction}_${part}`;
}

function getL(parts) {
	return parts.map((part) => getPoint("left", part));
}

function getR(parts) {
	return parts.map((part) => getPoint("right", part));
}

function computeAngle(left, infl, right) {
	return (
		((Math.atan2(left[1] - infl[1], left[0] - infl[0]) -
			Math.atan2(right[1] - infl[1], right[0] - infl[0])) *
			180) /
		Math.PI
	);
}

const average = (array) => array.reduce((a, b) => a + b) / array.length;

function getRequiredAngles(keypoints) {
	let inflectionPoints = [
		getL(["shoulder", "elbow", "wrist"]),
		getR(["shoulder", "elbow", "wrist"]),

		getL(["hip", "knee", "ankle"]),
		getR(["hip", "knee", "ankle"]),

		getL(["shoulder", "hip", "knee"]),
		getR(["shoulder", "hip", "knee"]),

		getL(["elbow", "shoulder", "hip"]),
		getR(["elbow", "shoulder", "hip"]),

		["nose", "left_shoulder", "right_shoulder"],
		["nose", "right_shoulder", "left_shoulder"],
	];

	let mapped_parts = {};
	inflectionPoints.forEach((parts) => {
		parts.forEach((part) => {
			if (part in mapped_parts) return;
			mapped_parts[part] = 1;
		});
	});
	let mapped_scores = getMappedScores(mapped_parts, keypoints);
	mapped_parts = getMappedParts(mapped_parts, keypoints);

	let angleVector = inflectionPoints.map((pt) => {
		let [left, infl, right] = pt;
		// console.log(pt, left, infl, right);
		return computeAngle(
			mapped_parts[left],
			mapped_parts[infl],
			mapped_parts[right]
		);
	});

	inflectionPoints.forEach((pt) => {
		// let totAvg = average([
		// 	mapped_scores[pt[0]],
		// 	mapped_scores[pt[1]],
		// 	mapped_scores[pt[2]],
		// ]);

		let totAvg = Math.min(...[
			mapped_scores[pt[0]],
			mapped_scores[pt[1]],
			mapped_scores[pt[2]],
		]);

		angleVector.push(totAvg);
	});

	return angleVector;
}

export {
	getTorsoSize,
	getMappedParts,
	getMidPoint,
	euclideanDistance,
	weightedDistanceMatching,
	cosineDistanceMatching,
	l2norm,
	getRequiredAngles,
	weightedDistanceMatchingForAngles,
};
