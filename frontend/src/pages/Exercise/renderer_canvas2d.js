// Renderer for MediaPipe Pose — adapted from the original MoveNet renderer.
// Draws keypoints and skeleton without any TensorFlow.js dependencies.

const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_RADIUS = 4;
const SCORE_THRESHOLD = 0.3;

// Skeleton connections for the 17 MoveNet-compatible keypoints.
// Each pair [i, j] indicates a bone to draw between keypoint i and keypoint j.
// Indices: 0=nose, 1=left_eye, 2=right_eye, 3=left_ear, 4=right_ear,
//   5=left_shoulder, 6=right_shoulder, 7=left_elbow, 8=right_elbow,
//   9=left_wrist, 10=right_wrist, 11=left_hip, 12=right_hip,
//   13=left_knee, 14=right_knee, 15=left_ankle, 16=right_ankle
const SKELETON_CONNECTIONS = [
  [0, 1],   // nose -> left_eye
  [0, 2],   // nose -> right_eye
  [1, 3],   // left_eye -> left_ear
  [2, 4],   // right_eye -> right_ear
  [5, 6],   // left_shoulder -> right_shoulder
  [5, 7],   // left_shoulder -> left_elbow
  [7, 9],   // left_elbow -> left_wrist
  [6, 8],   // right_shoulder -> right_elbow
  [8, 10],  // right_elbow -> right_wrist
  [5, 11],  // left_shoulder -> left_hip
  [6, 12],  // right_shoulder -> right_hip
  [11, 12], // left_hip -> right_hip
  [11, 13], // left_hip -> left_knee
  [13, 15], // left_knee -> left_ankle
  [12, 14], // right_hip -> right_knee
  [14, 16], // right_knee -> right_ankle
];

// Keypoint indices grouped by body side for coloring
const KEYPOINT_SIDES = {
  middle: [0],                      // nose (red)
  left: [1, 3, 5, 7, 9, 11, 13, 15],  // left side (green)
  right: [2, 4, 6, 8, 10, 12, 14, 16], // right side (orange)
};


export class RendererCanvas2d {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');

    this.videoWidth = canvas.width;
    this.videoHeight = canvas.height;
  }

  flip(videoWidth) {
    // Because the image from camera is mirrored, need to flip horizontally.
    this.ctx.translate(videoWidth, 0);
    this.ctx.scale(-1, 1);
  }

  draw(rendererParams) {
    const [video, poses] = rendererParams;
    this.drawCtx(video);

    if (poses && poses.length > 0) {
      this.drawResults(poses);
    }
  }

  drawCtx(video) {
    this.ctx.drawImage(video, 0, 0, this.videoWidth, this.videoHeight);
  }

  clearCtx() {
    this.ctx.clearRect(0, 0, this.videoWidth, this.videoHeight);
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param poses A list of poses to render.
   */
  drawResults(poses) {
    for (const pose of poses) {
      this.drawResult(pose);
    }
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  drawResult(pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints);
    }
  }

  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  drawKeypoints(keypoints) {
    this.ctx.strokeStyle = 'White';
    this.ctx.lineWidth = DEFAULT_LINE_WIDTH;

    this.ctx.fillStyle = 'Red';
    for (const i of KEYPOINT_SIDES.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = 'Green';
    for (const i of KEYPOINT_SIDES.left) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = 'Orange';
    for (const i of KEYPOINT_SIDES.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = SCORE_THRESHOLD;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
      this.ctx.fill(circle);
      this.ctx.stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints) {
    this.ctx.fillStyle = 'White';
    this.ctx.strokeStyle = 'White';
    this.ctx.lineWidth = DEFAULT_LINE_WIDTH;

    SKELETON_CONNECTIONS.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      const scoreThreshold = SCORE_THRESHOLD;

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        this.ctx.beginPath();
        this.ctx.moveTo(kp1.x, kp1.y);
        this.ctx.lineTo(kp2.x, kp2.y);
        this.ctx.stroke();
      }
    });
  }
}