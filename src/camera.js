import * as THREE from 'three';

export function orbitCamera(camera, target, deltaX, deltaY, sensitivity = 0.006) {
  const offset = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta += deltaX * sensitivity;
  spherical.phi = THREE.MathUtils.clamp(spherical.phi + deltaY * sensitivity, 0.2, 1.42);
  camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
  camera.lookAt(target);
  return camera;
}
export function panCamera(camera, target, deltaX, deltaY, sensitivity = 0.00115) {
  const distance = camera.position.distanceTo(target), scale = distance * sensitivity;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
  const shift = right.multiplyScalar(-deltaX * scale).add(forward.multiplyScalar(deltaY * scale));
  target.add(shift); camera.position.add(shift); camera.lookAt(target); return camera;
}
export function zoomCamera(camera, target, deltaY, minimum = 14, maximum = 370) {
  const offset = camera.position.clone().sub(target);
  offset.multiplyScalar(deltaY > 0 ? 1.095 : 0.914);
  offset.setLength(THREE.MathUtils.clamp(offset.length(), minimum, maximum));
  camera.position.copy(target).add(offset); camera.lookAt(target); return camera;
}
export function clampCameraTarget(camera, target, limit) {
  const previous = target.clone();
  target.x = THREE.MathUtils.clamp(target.x, -limit, limit);
  target.z = THREE.MathUtils.clamp(target.z, -limit, limit);
  camera.position.add(target.clone().sub(previous)); camera.lookAt(target); return target;
}
