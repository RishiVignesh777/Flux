extends Node2D
class_name InteractiveObjectSystem

# Interactive Object System for FLUX
# Defines reusable puzzle components:
# 1. PressurePlate (Normal & Heavy-only variants)
# 2. MagneticSurface (Attracts & anchors player in Magnetic state)
# 3. EnergyDoor (Unlocks via triggers or required state)
# 4. LaserEmitter & Receiver
# 5. LaunchPad (Spring kinetic accelerator)
# 6. GravitySwitch (Rotates gravity on contact)
# 7. FluxShard (Collectible energy fragments)

# -------------------------------------------------------------
# Base Interactive Object
# -------------------------------------------------------------
class InteractiveObject extends Area2D:
	signal triggered(state: bool)
	var is_active: bool = false

# -------------------------------------------------------------
# Pressure Plate
# -------------------------------------------------------------
class PressurePlate extends Area2D:
	signal state_changed(is_pressed: bool)
	@export var requires_heavy: bool = false
	var is_pressed: bool = false
	var overlapping_bodies: Array = []

	func _ready() -> void:
		body_entered.connect(_on_body_entered)
		body_exit.connect(_on_body_exited)

	func _on_body_entered(body: Node2D) -> void:
		if not overlapping_bodies.has(body):
			overlapping_bodies.append(body)
		_evaluate_press()

	func _on_body_exited(body: Node2D) -> void:
		overlapping_bodies.erase(body)
		_evaluate_press()

	func _evaluate_press() -> void:
		var should_press = false
		for b in overlapping_bodies:
			if b is PlayerController:
				if not requires_heavy or b.current_state == PhysicsStateManager.State.HEAVY:
					should_press = true
					break

		if should_press != is_pressed:
			is_pressed = should_press
			state_changed.emit(is_pressed)
			if SoundManager:
				SoundManager.play_plate(is_pressed)

# -------------------------------------------------------------
# Magnetic Surface
# -------------------------------------------------------------
class MagneticSurface extends Area2D:
	@export var surface_normal: Vector2 = Vector2.UP

	func _ready() -> void:
		body_entered.connect(_on_body_entered)

	func _on_body_entered(body: Node2D) -> void:
		if body is PlayerController and body.current_state == PhysicsStateManager.State.MAGNETIC:
			body.is_attached_to_magnet = true
			body.magnet_surface_normal = surface_normal
			if SoundManager:
				SoundManager.play_magnet_pull()

# -------------------------------------------------------------
# Energy Door / Exit Portal
# -------------------------------------------------------------
class EnergyDoor extends Area2D:
	signal door_entered(player: Node2D)
	@export var is_exit_door: bool = true
	@export var is_open: bool = true

	func _ready() -> void:
		body_entered.connect(_on_body_entered)

	func _on_body_entered(body: Node2D) -> void:
		if not is_open:
			return
		if body is PlayerController:
			if is_exit_door:
				body.reach_exit()
			door_entered.emit(body)

# -------------------------------------------------------------
# Gravity Switch
# -------------------------------------------------------------
class GravitySwitch extends Area2D:
	@export var target_gravity_direction: GravitySystem.Direction = GravitySystem.Direction.UP

	func _ready() -> void:
		body_entered.connect(_on_body_entered)

	func _on_body_entered(body: Node2D) -> void:
		if body is PlayerController:
			if GravitySystem:
				GravitySystem.set_gravity_direction(target_gravity_direction)
			if SoundManager:
				SoundManager.play_gravity_shift()

# -------------------------------------------------------------
# Launch Pad
# -------------------------------------------------------------
class LaunchPad extends Area2D:
	@export var launch_force: float = 750.0
	@export var launch_direction: Vector2 = Vector2.UP

	func _ready() -> void:
		body_entered.connect(_on_body_entered)

	func _on_body_entered(body: Node2D) -> void:
		if body is PlayerController:
			var mass_mult = PhysicsStateManager.get_state_prop(body.current_state, "mass_multiplier", 1.0)
			var impulse = MomentumSystem.calculate_launch_impulse(launch_force, mass_mult, launch_direction)
			body.velocity = impulse
			if SoundManager:
				SoundManager.play_launch()

# -------------------------------------------------------------
# Flux Shard Collectible
# -------------------------------------------------------------
class FluxShard extends Area2D:
	signal collected(shard_id: int)
	@export var shard_id: int = 0
	var is_collected: bool = false

	func _ready() -> void:
		body_entered.connect(_on_body_entered)

	func _on_body_entered(body: Node2D) -> void:
		if is_collected:
			return
		if body is PlayerController:
			is_collected = true
			collected.emit(shard_id)
			if SoundManager:
				SoundManager.play_shard()
			queue_free()
